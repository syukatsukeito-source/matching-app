package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type appsyncEvent struct {
	Arguments struct {
		TargetUserID string `json:"targetUserId"`
		Action       string `json:"action"` // "LIKE" or "PASS"
	} `json:"arguments"`
	Identity struct {
		Claims map[string]any `json:"claims"`
	} `json:"identity"`
}

type reactionResult struct {
	Success      bool   `json:"success"`
	Matched      bool   `json:"matched"`
	TargetUserID string `json:"targetUserId"`
}

var dynamoClient *dynamodb.Client
var reactionsTableName = os.Getenv("REACTIONS_TABLE_NAME")

func init() {
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err == nil {
		dynamoClient = dynamodb.NewFromConfig(cfg)
	}
}

func handler(ctx context.Context, event appsyncEvent) (reactionResult, error) {
	claims := event.Identity.Claims
	fromUserID, _ := claims["sub"].(string)
	if fromUserID == "" {
		return reactionResult{}, fmt.Errorf("missing cognito sub claim")
	}

	toUserID := event.Arguments.TargetUserID
	action := event.Arguments.Action

	if dynamoClient == nil || reactionsTableName == "" {
		return reactionResult{}, fmt.Errorf("dynamodb not configured")
	}

	now := time.Now().UTC().Format(time.RFC3339)

	// リアクションを保存
	_, err := dynamoClient.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(reactionsTableName),
		Item: map[string]types.AttributeValue{
			"fromUserId": &types.AttributeValueMemberS{Value: fromUserID},
			"toUserId":   &types.AttributeValueMemberS{Value: toUserID},
			"action":     &types.AttributeValueMemberS{Value: action},
			"createdAt":  &types.AttributeValueMemberS{Value: now},
		},
	})
	if err != nil {
		return reactionResult{}, fmt.Errorf("put reaction: %w", err)
	}

	// LIKE の場合、相手も LIKE しているかチェック
	matched := false
	if action == "LIKE" {
		result, err := dynamoClient.GetItem(ctx, &dynamodb.GetItemInput{
			TableName: aws.String(reactionsTableName),
			Key: map[string]types.AttributeValue{
				"fromUserId": &types.AttributeValueMemberS{Value: toUserID},
				"toUserId":   &types.AttributeValueMemberS{Value: fromUserID},
			},
		})
		if err == nil && result.Item != nil {
			if actionAttr, ok := result.Item["action"]; ok {
				if actionStr, ok := actionAttr.(*types.AttributeValueMemberS); ok {
					if actionStr.Value == "LIKE" {
						matched = true
					}
				}
			}
		}
	}

	return reactionResult{
		Success:      true,
		Matched:      matched,
		TargetUserID: toUserID,
	}, nil
}

func main() {
	lambda.Start(handler)
}
