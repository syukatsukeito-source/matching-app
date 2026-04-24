package main

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
)

type appsyncEvent struct {
	Identity struct {
		Claims map[string]any `json:"claims"`
	} `json:"identity"`
}

type viewer struct {
	UserID           string `json:"userId" dynamodbav:"userId"`
	Email            string `json:"email,omitempty" dynamodbav:"email,omitempty"`
	Status           string `json:"status" dynamodbav:"status"`
	ProfileCompleted bool   `json:"profileCompleted" dynamodbav:"profileCompleted"`
	CreatedAt        string `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt        string `json:"updatedAt" dynamodbav:"updatedAt"`
}

var dynamoClient *dynamodb.Client
var usersTableName = os.Getenv("USERS_TABLE_NAME")

func init() {
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err == nil {
		dynamoClient = dynamodb.NewFromConfig(cfg)
	}
}

func handler(ctx context.Context, event appsyncEvent) (viewer, error) {
	claims := event.Identity.Claims
	userID, _ := claims["sub"].(string)
	if userID == "" {
		return viewer{}, fmt.Errorf("missing cognito sub claim")
	}

	email, _ := claims["email"].(string)
	now := time.Now().UTC().Format(time.RFC3339)
	item := viewer{
		UserID:           userID,
		Email:            email,
		Status:           "PENDING_PROFILE",
		ProfileCompleted: false,
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	if dynamoClient != nil && usersTableName != "" {
		av, err := attributevalue.MarshalMap(item)
		if err != nil {
			return viewer{}, fmt.Errorf("marshal user: %w", err)
		}

		_, err = dynamoClient.PutItem(ctx, &dynamodb.PutItemInput{
			TableName:           &usersTableName,
			Item:                av,
			ConditionExpression: awsString("attribute_not_exists(userId)"),
		})
		if err != nil && !isConditionalCheckFailed(err) {
			return viewer{}, fmt.Errorf("put user: %w", err)
		}
	}

	return item, nil
}

func awsString(value string) *string {
	return &value
}

func isConditionalCheckFailed(err error) bool {
	return err != nil && strings.Contains(err.Error(), "ConditionalCheckFailedException")
}

func main() {
	lambda.Start(handler)
}
