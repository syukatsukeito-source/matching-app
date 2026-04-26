"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingWafStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const wafv2 = require("aws-cdk-lib/aws-wafv2");
class MatchingWafStack extends aws_cdk_lib_1.Stack {
    webAclArn;
    constructor(scope, id, props) {
        super(scope, id, props);
        const webAcl = new wafv2.CfnWebACL(this, 'WebACL', {
            scope: 'CLOUDFRONT',
            defaultAction: { allow: {} },
            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: 'MatchingAppWebACL',
                sampledRequestsEnabled: true,
            },
            rules: [
                {
                    name: 'RateLimitRule',
                    priority: 1,
                    statement: {
                        rateBasedStatement: {
                            limit: 2000,
                            aggregateKeyType: 'IP',
                        },
                    },
                    action: { block: {} },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: 'RateLimitRule',
                        sampledRequestsEnabled: true,
                    },
                },
                {
                    name: 'AWSManagedRulesCommonRuleSet',
                    priority: 2,
                    statement: {
                        managedRuleGroupStatement: {
                            vendorName: 'AWS',
                            name: 'AWSManagedRulesCommonRuleSet',
                        },
                    },
                    overrideAction: { none: {} },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: 'AWSManagedRulesCommonRuleSet',
                        sampledRequestsEnabled: true,
                    },
                },
                {
                    name: 'AWSManagedRulesKnownBadInputsRuleSet',
                    priority: 3,
                    statement: {
                        managedRuleGroupStatement: {
                            vendorName: 'AWS',
                            name: 'AWSManagedRulesKnownBadInputsRuleSet',
                        },
                    },
                    overrideAction: { none: {} },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: 'AWSManagedRulesKnownBadInputsRuleSet',
                        sampledRequestsEnabled: true,
                    },
                },
            ],
        });
        this.webAclArn = webAcl.attrArn;
        new aws_cdk_lib_1.CfnOutput(this, 'WebAclArn', { value: webAcl.attrArn });
    }
}
exports.MatchingWafStack = MatchingWafStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0Y2hpbmctd2FmLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWF0Y2hpbmctd2FmLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZDQUEyRDtBQUUzRCwrQ0FBK0M7QUFFL0MsTUFBYSxnQkFBaUIsU0FBUSxtQkFBSztJQUN6QixTQUFTLENBQVM7SUFFbEMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFrQjtRQUMxRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLE1BQU0sR0FBRyxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtZQUNqRCxLQUFLLEVBQUUsWUFBWTtZQUNuQixhQUFhLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO1lBQzVCLGdCQUFnQixFQUFFO2dCQUNoQix3QkFBd0IsRUFBRSxJQUFJO2dCQUM5QixVQUFVLEVBQUUsbUJBQW1CO2dCQUMvQixzQkFBc0IsRUFBRSxJQUFJO2FBQzdCO1lBQ0QsS0FBSyxFQUFFO2dCQUNMO29CQUNFLElBQUksRUFBRSxlQUFlO29CQUNyQixRQUFRLEVBQUUsQ0FBQztvQkFDWCxTQUFTLEVBQUU7d0JBQ1Qsa0JBQWtCLEVBQUU7NEJBQ2xCLEtBQUssRUFBRSxJQUFJOzRCQUNYLGdCQUFnQixFQUFFLElBQUk7eUJBQ3ZCO3FCQUNGO29CQUNELE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7b0JBQ3JCLGdCQUFnQixFQUFFO3dCQUNoQix3QkFBd0IsRUFBRSxJQUFJO3dCQUM5QixVQUFVLEVBQUUsZUFBZTt3QkFDM0Isc0JBQXNCLEVBQUUsSUFBSTtxQkFDN0I7aUJBQ0Y7Z0JBQ0Q7b0JBQ0UsSUFBSSxFQUFFLDhCQUE4QjtvQkFDcEMsUUFBUSxFQUFFLENBQUM7b0JBQ1gsU0FBUyxFQUFFO3dCQUNULHlCQUF5QixFQUFFOzRCQUN6QixVQUFVLEVBQUUsS0FBSzs0QkFDakIsSUFBSSxFQUFFLDhCQUE4Qjt5QkFDckM7cUJBQ0Y7b0JBQ0QsY0FBYyxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRTtvQkFDNUIsZ0JBQWdCLEVBQUU7d0JBQ2hCLHdCQUF3QixFQUFFLElBQUk7d0JBQzlCLFVBQVUsRUFBRSw4QkFBOEI7d0JBQzFDLHNCQUFzQixFQUFFLElBQUk7cUJBQzdCO2lCQUNGO2dCQUNEO29CQUNFLElBQUksRUFBRSxzQ0FBc0M7b0JBQzVDLFFBQVEsRUFBRSxDQUFDO29CQUNYLFNBQVMsRUFBRTt3QkFDVCx5QkFBeUIsRUFBRTs0QkFDekIsVUFBVSxFQUFFLEtBQUs7NEJBQ2pCLElBQUksRUFBRSxzQ0FBc0M7eUJBQzdDO3FCQUNGO29CQUNELGNBQWMsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUU7b0JBQzVCLGdCQUFnQixFQUFFO3dCQUNoQix3QkFBd0IsRUFBRSxJQUFJO3dCQUM5QixVQUFVLEVBQUUsc0NBQXNDO3dCQUNsRCxzQkFBc0IsRUFBRSxJQUFJO3FCQUM3QjtpQkFDRjthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO1FBRWhDLElBQUksdUJBQVMsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO0lBQzlELENBQUM7Q0FDRjtBQXRFRCw0Q0FzRUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDZm5PdXRwdXQsIFN0YWNrLCBTdGFja1Byb3BzIH0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyB3YWZ2MiBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtd2FmdjInO1xuXG5leHBvcnQgY2xhc3MgTWF0Y2hpbmdXYWZTdGFjayBleHRlbmRzIFN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IHdlYkFjbEFybjogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3Qgd2ViQWNsID0gbmV3IHdhZnYyLkNmbldlYkFDTCh0aGlzLCAnV2ViQUNMJywge1xuICAgICAgc2NvcGU6ICdDTE9VREZST05UJyxcbiAgICAgIGRlZmF1bHRBY3Rpb246IHsgYWxsb3c6IHt9IH0sXG4gICAgICB2aXNpYmlsaXR5Q29uZmlnOiB7XG4gICAgICAgIGNsb3VkV2F0Y2hNZXRyaWNzRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgbWV0cmljTmFtZTogJ01hdGNoaW5nQXBwV2ViQUNMJyxcbiAgICAgICAgc2FtcGxlZFJlcXVlc3RzRW5hYmxlZDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBydWxlczogW1xuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ1JhdGVMaW1pdFJ1bGUnLFxuICAgICAgICAgIHByaW9yaXR5OiAxLFxuICAgICAgICAgIHN0YXRlbWVudDoge1xuICAgICAgICAgICAgcmF0ZUJhc2VkU3RhdGVtZW50OiB7XG4gICAgICAgICAgICAgIGxpbWl0OiAyMDAwLFxuICAgICAgICAgICAgICBhZ2dyZWdhdGVLZXlUeXBlOiAnSVAnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGFjdGlvbjogeyBibG9jazoge30gfSxcbiAgICAgICAgICB2aXNpYmlsaXR5Q29uZmlnOiB7XG4gICAgICAgICAgICBjbG91ZFdhdGNoTWV0cmljc0VuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICBtZXRyaWNOYW1lOiAnUmF0ZUxpbWl0UnVsZScsXG4gICAgICAgICAgICBzYW1wbGVkUmVxdWVzdHNFbmFibGVkOiB0cnVlLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnQVdTTWFuYWdlZFJ1bGVzQ29tbW9uUnVsZVNldCcsXG4gICAgICAgICAgcHJpb3JpdHk6IDIsXG4gICAgICAgICAgc3RhdGVtZW50OiB7XG4gICAgICAgICAgICBtYW5hZ2VkUnVsZUdyb3VwU3RhdGVtZW50OiB7XG4gICAgICAgICAgICAgIHZlbmRvck5hbWU6ICdBV1MnLFxuICAgICAgICAgICAgICBuYW1lOiAnQVdTTWFuYWdlZFJ1bGVzQ29tbW9uUnVsZVNldCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgb3ZlcnJpZGVBY3Rpb246IHsgbm9uZToge30gfSxcbiAgICAgICAgICB2aXNpYmlsaXR5Q29uZmlnOiB7XG4gICAgICAgICAgICBjbG91ZFdhdGNoTWV0cmljc0VuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICBtZXRyaWNOYW1lOiAnQVdTTWFuYWdlZFJ1bGVzQ29tbW9uUnVsZVNldCcsXG4gICAgICAgICAgICBzYW1wbGVkUmVxdWVzdHNFbmFibGVkOiB0cnVlLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnQVdTTWFuYWdlZFJ1bGVzS25vd25CYWRJbnB1dHNSdWxlU2V0JyxcbiAgICAgICAgICBwcmlvcml0eTogMyxcbiAgICAgICAgICBzdGF0ZW1lbnQ6IHtcbiAgICAgICAgICAgIG1hbmFnZWRSdWxlR3JvdXBTdGF0ZW1lbnQ6IHtcbiAgICAgICAgICAgICAgdmVuZG9yTmFtZTogJ0FXUycsXG4gICAgICAgICAgICAgIG5hbWU6ICdBV1NNYW5hZ2VkUnVsZXNLbm93bkJhZElucHV0c1J1bGVTZXQnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIG92ZXJyaWRlQWN0aW9uOiB7IG5vbmU6IHt9IH0sXG4gICAgICAgICAgdmlzaWJpbGl0eUNvbmZpZzoge1xuICAgICAgICAgICAgY2xvdWRXYXRjaE1ldHJpY3NFbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgbWV0cmljTmFtZTogJ0FXU01hbmFnZWRSdWxlc0tub3duQmFkSW5wdXRzUnVsZVNldCcsXG4gICAgICAgICAgICBzYW1wbGVkUmVxdWVzdHNFbmFibGVkOiB0cnVlLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgdGhpcy53ZWJBY2xBcm4gPSB3ZWJBY2wuYXR0ckFybjtcblxuICAgIG5ldyBDZm5PdXRwdXQodGhpcywgJ1dlYkFjbEFybicsIHsgdmFsdWU6IHdlYkFjbC5hdHRyQXJuIH0pO1xuICB9XG59XG4iXX0=