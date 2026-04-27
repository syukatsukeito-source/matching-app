package main

import (
	"context"
	"fmt"
	"math"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type Event struct {
	Arguments struct {
		Limit int `json:"limit"`
	} `json:"arguments"`
	Identity struct {
		Claims struct {
			Sub string `json:"sub"`
		} `json:"claims"`
	} `json:"identity"`
}

type UserProfile struct {
	UserId           string   `json:"userId" dynamodbav:"userId"`
	DisplayName      string   `json:"displayName" dynamodbav:"displayName"`
	Age              *int     `json:"age,omitempty" dynamodbav:"age,omitempty"`
	Gender           *string  `json:"gender,omitempty" dynamodbav:"gender,omitempty"`
	Bio              *string  `json:"bio,omitempty" dynamodbav:"bio,omitempty"`
	PhotoUrl         *string  `json:"photoUrl,omitempty" dynamodbav:"photoUrl,omitempty"`
	Status           string   `json:"status" dynamodbav:"status"`
	Latitude         *float64 `json:"latitude,omitempty" dynamodbav:"latitude,omitempty"`
	Longitude        *float64 `json:"longitude,omitempty" dynamodbav:"longitude,omitempty"`
	MaxDistanceKm    *int     `json:"maxDistanceKm,omitempty" dynamodbav:"maxDistanceKm,omitempty"`
	ProfileCompleted bool     `json:"profileCompleted" dynamodbav:"profileCompleted"`
}

type Response struct {
	UserId      string   `json:"userId"`
	DisplayName string   `json:"displayName"`
	Age         *int     `json:"age,omitempty"`
	Gender      *string  `json:"gender,omitempty"`
	Bio         *string  `json:"bio,omitempty"`
	PhotoUrl    *string  `json:"photoUrl,omitempty"`
	DistanceKm  *float64 `json:"distanceKm,omitempty"`
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

// Haversine formula to calculate distance
func haversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadius = 6371.0 // km

	dLat := (lat2 - lat1) * math.Pi / 180
	dLon := (lon2 - lon1) * math.Pi / 180

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLon/2)*math.Sin(dLon/2)

	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return earthRadius * c
}

func handler(ctx context.Context, event Event) ([]Response, error) {
	userId := event.Identity.Claims.Sub
	limit := event.Arguments.Limit
	if limit == 0 {
		limit = 20
	}

	// 自分のプロフィールを取得
	myResult, err := ddb.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(tableName),
		Key: map[string]types.AttributeValue{
			"userId": &types.AttributeValueMemberS{Value: userId},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get my profile: %w", err)
	}

	var myProfile UserProfile
	if err := attributevalue.UnmarshalMap(myResult.Item, &myProfile); err != nil {
		return nil, fmt.Errorf("failed to unmarshal my profile: %w", err)
	}

	// すべてのユーザーを取得（ACTIVE、profileCompleted=true）
	scanResult, err := ddb.Scan(ctx, &dynamodb.ScanInput{
		TableName:        aws.String(tableName),
		FilterExpression: aws.String("#status = :active AND profileCompleted = :true AND userId <> :myId"),
		ExpressionAttributeNames: map[string]string{
			"#status": "status",
		},
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":active": &types.AttributeValueMemberS{Value: "ACTIVE"},
			":true":   &types.AttributeValueMemberBOOL{Value: true},
			":myId":   &types.AttributeValueMemberS{Value: userId},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to scan users: %w", err)
	}

	var users []UserProfile
	if err := attributevalue.UnmarshalListOfMaps(scanResult.Items, &users); err != nil {
		return nil, fmt.Errorf("failed to unmarshal users: %w", err)
	}

	// 距離フィルタリング
	var results []Response
	for _, user := range users {
		var distanceKm *float64

		// 両者に位置情報がある場合のみ距離計算
		if myProfile.Latitude != nil && myProfile.Longitude != nil &&
			user.Latitude != nil && user.Longitude != nil {

			distance := haversineDistance(
				*myProfile.Latitude, *myProfile.Longitude,
				*user.Latitude, *user.Longitude,
			)

			// 自分の設定距離内かチェック
			if myProfile.MaxDistanceKm != nil && distance > float64(*myProfile.MaxDistanceKm) {
				continue
			}

			// 相手の設定距離内かチェック
			if user.MaxDistanceKm != nil && distance > float64(*user.MaxDistanceKm) {
				continue
			}

			distanceKm = &distance
		}

		results = append(results, Response{
			UserId:      user.UserId,
			DisplayName: user.DisplayName,
			Age:         user.Age,
			Gender:      user.Gender,
			Bio:         user.Bio,
			PhotoUrl:    user.PhotoUrl,
			DistanceKm:  distanceKm,
		})

		if len(results) >= limit {
			break
		}
	}

	return results, nil
}

func main() {
	lambda.Start(handler)
}
