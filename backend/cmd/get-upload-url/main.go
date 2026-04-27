package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type Event struct {
	Arguments struct {
		Input struct {
			FileName    string `json:"fileName"`
			ContentType string `json:"contentType"`
		} `json:"input"`
	} `json:"arguments"`
	Identity struct {
		Claims struct {
			Sub string `json:"sub"`
		} `json:"claims"`
	} `json:"identity"`
}

type Response struct {
	UploadUrl string `json:"uploadUrl"`
	PhotoUrl  string `json:"photoUrl"`
}

var (
	s3Client   *s3.Client
	bucketName string
	cdnUrl     string
)

func init() {
	bucketName = os.Getenv("PHOTO_BUCKET_NAME")
	cdnUrl = os.Getenv("CDN_URL")

	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		panic(fmt.Sprintf("failed to load AWS config: %v", err))
	}
	s3Client = s3.NewFromConfig(cfg)
}

func handler(ctx context.Context, event Event) (*Response, error) {
	userId := event.Identity.Claims.Sub
	input := event.Arguments.Input

	// S3キーを生成
	key := fmt.Sprintf("profiles/%s/%d-%s", userId, time.Now().Unix(), input.FileName)

	// Presigned URLを生成
	presignClient := s3.NewPresignClient(s3Client)
	presignResult, err := presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(bucketName),
		Key:         aws.String(key),
		ContentType: aws.String(input.ContentType),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = 15 * time.Minute
	})
	if err != nil {
		return nil, fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	// CloudFront URLを生成
	photoUrl := fmt.Sprintf("%s/%s", cdnUrl, key)

	return &Response{
		UploadUrl: presignResult.URL,
		PhotoUrl:  photoUrl,
	}, nil
}

func main() {
	lambda.Start(handler)
}
