import { db, storiesTable } from "../../airtable"
import logger from "../../logger";
import type Slack from "@slack/bolt";

export default async (firstName: string, slackId: string) => {
    logger.debug(`Generating reporter home for ${firstName} (${slackId})`);
    const stories = await db.scan(storiesTable, {
        filterByFormula: `FIND("${slackId}", {slack_id_rollup}) > 0`,
    })

    const storyBlocks = stories.length === 0 ? [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "No stories yet - get writing!"
            }
        }
    ] : stories.map(story => {
        console.log(`*${story.headline}* _(${story.status})_\n${story.shortDescription}​`)
        return {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*${story.headline}* _(${story.status})_\n${story.shortDescription}​`
            },
            accessory: {
                type: "button",
                text: {
                    type: "plain_text",
                    text: "Edit Story",
                    emoji: true
                },
                action_id: "edit-story-button",
                value: story.id
            }
        }
    })
    const unpublishedStoriesCount = stories.filter(story => story.status === "Draft").length;

    return {
        type: "home" as const,
        blocks: [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: `Hey, ${firstName}!`,
                    emoji: true
                }
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "Welcome to Archimedes!"
                }
            },

            {
                type: "divider"
            },

            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: "Your Articles",
                    emoji: true
                }
            },
            ...storyBlocks,

            {
                type: "divider"
            },

            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "Start writing a new story! You'll be able to review it before it's sent for approval."
                },
                accessory: {
                    type: "button",
                    style: "primary",
                    text: {
                        type: "plain_text",
                        text: "New Story",
                        emoji: true
                    },
                    action_id: "new-story-button"
                }
            },
            unpublishedStoriesCount > 0 && {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "Publish a draft story for approval."
                },
                accessory: {
                    type: "button",
                    style: "primary",
                    text: {
                        type: "plain_text",
                        text: "Publish",
                        emoji: true
                    },
                    action_id: "publish-story-button"
                }
            }
        ].filter(Boolean)
    } as Slack.types.HomeView
}