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
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type Event struct {
	Arguments struct {
		Input struct {
			Latitude      float64 `json:"latitude"`
			Longitude     float64 `json:"longitude"`
			MaxDistanceKm *int    `json:"maxDistanceKm,omitempty"`
		} `json:"input"`
	} `json:"arguments"`
	Identity struct {
		Claims struct {
			Sub string `json:"sub"`
		} `json:"claims"`
	} `json:"identity"`
}

type MyProfile struct {
	UserId            string   `json:"userId" dynamodbav:"userId"`
	Email             *string  `json:"email,omitempty" dynamodbav:"email,omitempty"`
	Status            string   `json:"status" dynamodbav:"status"`
	ProfileCompleted  bool     `json:"profileCompleted" dynamodbav:"profileCompleted"`
	DisplayName       *string  `json:"displayName,omitempty" dynamodbav:"displayName,omitempty"`
	Age               *int     `json:"age,omitempty" dynamodbav:"age,omitempty"`
	Gender            *string  `json:"gender,omitempty" dynamodbav:"gender,omitempty"`
	Bio               *string  `json:"bio,omitempty" dynamodbav:"bio,omitempty"`
	PhotoUrl          *string  `json:"photoUrl,omitempty" dynamodbav:"photoUrl,omitempty"`
	Latitude          *float64 `json:"latitude,omitempty" dynamodbav:"latitude,omitempty"`
	Longitude         *float64 `json:"longitude,omitempty" dynamodbav:"longitude,omitempty"`
	MaxDistanceKm     *int     `json:"maxDistanceKm,omitempty" dynamodbav:"maxDistanceKm,omitempty"`
	LocationUpdatedAt *string  `json:"locationUpdatedAt,omitempty" dynamodbav:"locationUpdatedAt,omitempty"`
	CreatedAt         string   `json:"createdAt" dynamodbav:"createdAt"`
	UpdatedAt         string   `json:"updatedAt" dynamodbav:"updatedAt"`
}

var (
	ddb       *dynamodb.Client
	tableName string
)

func init() {
	tableName = os.Getenv("USERS_TABLE_NAME")
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		panic(fmt.Sprintf("failed to load AWS config: %v", err))
	}
	ddb = dynamodb.NewFromConfig(cfg)
}

func handler(ctx context.Context, event Event) (*MyProfile, error) {
	userId := event.Identity.Claims.Sub
	input := event.Arguments.Input

	now := time.Now().UTC().Format(time.RFC3339)

	// 更新式を構築
	updateExpr := "SET latitude = :lat, longitude = :lon, locationUpdatedAt = :locTime, updatedAt = :now"
	exprAttrValues := map[string]types.AttributeValue{
		":lat":     &types.AttributeValueMemberN{Value: fmt.Sprintf("%f", input.Latitude)},
		":lon":     &types.AttributeValueMemberN{Value: fmt.Sprintf("%f", input.Longitude)},
		":locTime": &types.AttributeValueMemberS{Value: now},
		":now":     &types.AttributeValueMemberS{Value: now},
	}

	if input.MaxDistanceKm != nil {
		updateExpr += ", maxDistanceKm = :maxDist"
		exprAttrValues[":maxDist"] = &types.AttributeValueMemberN{Value: fmt.Sprintf("%d", *input.MaxDistanceKm)}
	}

	// DynamoDB更新
	result, err := ddb.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(tableName),
		Key: map[string]types.AttributeValue{
			"userId": &types.AttributeValueMemberS{Value: userId},
		},
		UpdateExpression:          aws.String(updateExpr),
		ExpressionAttributeValues: exprAttrValues,
		ReturnValues:              types.ReturnValueAllNew,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update location: %w", err)
	}

	// 更新後のプロフィールを返す
	var profile MyProfile
	if err := attributevalue.UnmarshalMap(result.Attributes, &profile); err != nil {
		return nil, fmt.Errorf("failed to unmarshal profile: %w", err)
	}

	return &profile, nil
}

func main() {
	lambda.Start(handler)
}
