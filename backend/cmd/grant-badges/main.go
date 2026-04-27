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
)

type UserProfile struct {
	UserId    string `dynamodbav:"userId"`
	CreatedAt string `dynamodbav:"createdAt"`
}

type Badge struct {
	UserId      string `dynamodbav:"userId"`
	BadgeType   string `dynamodbav:"badgeType"`
	GrantedAt   string `dynamodbav:"grantedAt"`
	Title       string `dynamodbav:"title"`
	Description string `dynamodbav:"description"`
}

var (
	ddb             *dynamodb.Client
	usersTableName  string
	badgesTableName string
)

func init() {
	usersTableName = os.Getenv("USERS_TABLE_NAME")
	badgesTableName = os.Getenv("BADGES_TABLE_NAME")

	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		panic(fmt.Sprintf("failed to load AWS config: %v", err))
	}
	ddb = dynamodb.NewFromConfig(cfg)
}

func handler(ctx context.Context) error {
	// 全ユーザーを取得
	scanResult, err := ddb.Scan(ctx, &dynamodb.ScanInput{
		TableName: aws.String(usersTableName),
	})
	if err != nil {
		return fmt.Errorf("failed to scan users: %w", err)
	}

	var users []UserProfile
	if err := attributevalue.UnmarshalListOfMaps(scanResult.Items, &users); err != nil {
		return fmt.Errorf("failed to unmarshal users: %w", err)
	}

	now := time.Now().UTC()
	nowStr := now.Format(time.RFC3339)

	// 各ユーザーにバッジを付与
	for _, user := range users {
		createdAt, err := time.Parse(time.RFC3339, user.CreatedAt)
		if err != nil {
			continue
		}

		daysSinceCreation := int(now.Sub(createdAt).Hours() / 24)

		// 登録日数に応じたバッジ
		var badge *Badge
		switch daysSinceCreation {
		case 7:
			badge = &Badge{
				UserId:      user.UserId,
				BadgeType:   "WEEK_1",
				GrantedAt:   nowStr,
				Title:       "1週間記念",
				Description: "マッチングアプリを始めて1週間！",
			}
		case 30:
			badge = &Badge{
				UserId:      user.UserId,
				BadgeType:   "MONTH_1",
				GrantedAt:   nowStr,
				Title:       "1ヶ月記念",
				Description: "マッチングアプリを始めて1ヶ月！",
			}
		case 90:
			badge = &Badge{
				UserId:      user.UserId,
				BadgeType:   "MONTH_3",
				GrantedAt:   nowStr,
				Title:       "3ヶ月記念",
				Description: "マッチングアプリを始めて3ヶ月！",
			}
		case 365:
			badge = &Badge{
				UserId:      user.UserId,
				BadgeType:   "YEAR_1",
				GrantedAt:   nowStr,
				Title:       "1年記念",
				Description: "マッチングアプリを始めて1年！",
			}
		}

		if badge != nil {
			item, err := attributevalue.MarshalMap(badge)
			if err != nil {
				fmt.Printf("failed to marshal badge for user %s: %v\n", user.UserId, err)
				continue
			}

			_, err = ddb.PutItem(ctx, &dynamodb.PutItemInput{
				TableName: aws.String(badgesTableName),
				Item:      item,
			})
			if err != nil {
				fmt.Printf("failed to put badge for user %s: %v\n", user.UserId, err)
				continue
			}

			fmt.Printf("granted badge %s to user %s\n", badge.BadgeType, user.UserId)
		}
	}

	return nil
}

func main() {
	lambda.Start(handler)
}
