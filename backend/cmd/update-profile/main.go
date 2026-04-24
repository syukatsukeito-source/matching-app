package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type appsyncEvent struct {
	Arguments struct {
		Input struct {
			DisplayName *string `json:"displayName"`
			Age         *int    `json:"age"`
			Gender      *string `json:"gender"`
			Bio         *string `json:"bio"`
		} `json:"input"`
	} `json:"arguments"`
	Identity struct {
		Claims map[string]any `json:"claims"`
	} `json:"identity"`
}

type myProfile struct {
	UserID           string  `json:"userId" dynamodbav:"userId"`
	Email            string  `json:"email,omitempty" dynamodbav:"email,omitempty"`
	Status           string  `json:"status" dynamodbav:"status"`
	ProfileCompleted bool    `json:"profileCompleted" dynamodbav:"profileCompleted"`
	DisplayName      *string `json:"displayName,omitempty" dynamodbav:"displayName,omitempty"`
	Age              *int    `json:"age,omitempty" dynamodbav:"age,omitempty"`
	Gender           *string `json:"gender,omitempty" dynamodbav:"gender,omitempty"`
	Bio              *string `json:"bio,omitempty" dynamodbav:"bio,omitempty"`
	PhotoUrl         *string `json:"photoUrl,omitempty" dynamodbav:"photoUrl,omitempty"`
	CreatedAt        string  `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt        string  `json:"updatedAt" dynamodbav:"updatedAt"`
}

var dynamoClient *dynamodb.Client
var usersTableName = os.Getenv("USERS_TABLE_NAME")

func init() {
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err == nil {
		dynamoClient = dynamodb.NewFromConfig(cfg)
	}
}

func handler(ctx context.Context, event appsyncEvent) (myProfile, error) {
	claims := event.Identity.Claims
	userID, _ := claims["sub"].(string)
	if userID == "" {
		return myProfile{}, fmt.Errorf("missing cognito sub claim")
	}

	if dynamoClient == nil || usersTableName == "" {
		return myProfile{}, fmt.Errorf("dynamodb not configured")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	input := event.Arguments.Input

	// UpdateExpression を動的に構築
	update := expression.UpdateBuilder{}
	update = update.Set(expression.Name("updatedAt"), expression.Value(now))
	update = update.Set(expression.Name("profileCompleted"), expression.Value(true))
	update = update.Set(expression.Name("status"), expression.Value("ACTIVE"))

	if input.DisplayName != nil {
		update = update.Set(expression.Name("displayName"), expression.Value(*input.DisplayName))
	}
	if input.Age != nil {
		update = update.Set(expression.Name("age"), expression.Value(*input.Age))
	}
	if input.Gender != nil {
		update = update.Set(expression.Name("gender"), expression.Value(*input.Gender))
	}
	if input.Bio != nil {
		update = update.Set(expression.Name("bio"), expression.Value(*input.Bio))
	}

	expr, err := expression.NewBuilder().WithUpdate(update).Build()
	if err != nil {
		return myProfile{}, fmt.Errorf("build expression: %w", err)
	}

	result, err := dynamoClient.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(usersTableName),
		Key: map[string]types.AttributeValue{
			"userId": &types.AttributeValueMemberS{Value: userID},
		},
		UpdateExpression:          expr.Update(),
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
		ReturnValues:              types.ReturnValueAllNew,
	})
	if err != nil {
		return myProfile{}, fmt.Errorf("update user: %w", err)
	}

	var profile myProfile
	err = attributevalue.UnmarshalMap(result.Attributes, &profile)
	if err != nil {
		return myProfile{}, fmt.Errorf("unmarshal profile: %w", err)
	}

	return profile, nil
}

func main() {
	lambda.Start(handler)
}
