package main

import (
	"context"
	"fmt"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type appsyncEvent struct {
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

	result, err := dynamoClient.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: &usersTableName,
		Key: map[string]types.AttributeValue{
			"userId": &types.AttributeValueMemberS{Value: userID},
		},
	})
	if err != nil {
		return myProfile{}, fmt.Errorf("get user: %w", err)
	}

	if result.Item == nil {
		return myProfile{}, fmt.Errorf("user not found: %s", userID)
	}

	var item myProfile
	err = attributevalue.UnmarshalMap(result.Item, &item)
	if err != nil {
		return myProfile{}, fmt.Errorf("unmarshal user: %w", err)
	}

	return item, nil
}

func main() {
	lambda.Start(handler)
}
