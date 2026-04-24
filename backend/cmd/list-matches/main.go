package main

import (
	"context"
	"fmt"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type appsyncEvent struct {
	Arguments struct {
		Limit *int `json:"limit"`
	} `json:"arguments"`
	Identity struct {
		Claims map[string]any `json:"claims"`
	} `json:"identity"`
}

type userProfile struct {
	UserID      string  `json:"userId" dynamodbav:"userId"`
	DisplayName *string `json:"displayName,omitempty" dynamodbav:"displayName,omitempty"`
	Age         *int    `json:"age,omitempty" dynamodbav:"age,omitempty"`
	Gender      *string `json:"gender,omitempty" dynamodbav:"gender,omitempty"`
	Bio         *string `json:"bio,omitempty" dynamodbav:"bio,omitempty"`
	PhotoUrl    *string `json:"photoUrl,omitempty" dynamodbav:"photoUrl,omitempty"`
}

var dynamoClient *dynamodb.Client
var usersTableName = os.Getenv("USERS_TABLE_NAME")

func init() {
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err == nil {
		dynamoClient = dynamodb.NewFromConfig(cfg)
	}
}

func handler(ctx context.Context, event appsyncEvent) ([]userProfile, error) {
	claims := event.Identity.Claims
	currentUserID, _ := claims["sub"].(string)
	if currentUserID == "" {
		return nil, fmt.Errorf("missing cognito sub claim")
	}

	if dynamoClient == nil || usersTableName == "" {
		return nil, fmt.Errorf("dynamodb not configured")
	}

	limit := 10
	if event.Arguments.Limit != nil && *event.Arguments.Limit > 0 {
		limit = *event.Arguments.Limit
	}

	// ACTIVE ユーザーをスキャン（自分以外）
	result, err := dynamoClient.Scan(ctx, &dynamodb.ScanInput{
		TableName:        aws.String(usersTableName),
		FilterExpression: aws.String("#status = :active AND #userId <> :currentUserId"),
		ExpressionAttributeNames: map[string]string{
			"#status": "status",
			"#userId": "userId",
		},
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":active":        &types.AttributeValueMemberS{Value: "ACTIVE"},
			":currentUserId": &types.AttributeValueMemberS{Value: currentUserID},
		},
		Limit: aws.Int32(int32(limit)),
	})
	if err != nil {
		return nil, fmt.Errorf("scan users: %w", err)
	}

	var profiles []userProfile
	for _, item := range result.Items {
		var profile userProfile
		err := attributevalue.UnmarshalMap(item, &profile)
		if err != nil {
			continue
		}
		profiles = append(profiles, profile)
	}

	return profiles, nil
}

func main() {
	lambda.Start(handler)
}
