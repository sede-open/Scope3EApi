import fetch from 'node-fetch';
import { ChannelsListResponse, ChatPostMessageResponse } from '@slack/web-api';
import { FetchOptions } from '../types';
import { formattedDateTimeNow } from '../../utils/datetime';
import { Environment, getConfig } from '../../config';
import { logger } from '../../utils/logger';

export class SlackClient {
  private apiBase = 'https://slack.com/api/';

  private environment: string;
  private silence: boolean;

  constructor(private readonly authToken: string) {
    const {
      environment,
      slack: { silence },
    } = getConfig();
    this.environment = environment;
    this.silence = silence;
  }

  private async request(
    path: string,
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    { body, headers, queryParams }: FetchOptions<unknown> = {}
  ) {
    const searchParams = new URLSearchParams(queryParams);

    const res = await fetch(`${this.apiBase}${path}?${searchParams}`, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
        Charset: 'utf-8',
        Authorization: `Bearer ${this.authToken}`,
        ...(headers ? headers : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let message;
      try {
        const resp = await res.json();
        message = resp.message;
      } catch {
        message = res.statusText;
      }
      throw new Error(message);
    }

    try {
      return await res.json();
    } catch (error) {
      // Delete request does not respond with json
      return;
    }
  }

  /**
   * Finds all conversations -- loops through all pages.
   */
  async findConversations() {
    const results = [];
    let nextCursor = null;

    while (nextCursor !== '') {
      const {
        channels = [],
        response_metadata: responseMetadata = {},
      } = (await this.request('/conversations.list', 'GET', {
        queryParams: nextCursor ? { cursor: nextCursor } : {},
      })) as ChannelsListResponse;

      nextCursor = responseMetadata.next_cursor;

      const channelData = channels.map((channel) => ({
        id: channel.id,
        name: channel.name,
      }));

      results.push(channelData);
    }

    return results;
  }

  async postMessage(
    message: string,
    channel: string
  ): Promise<ChatPostMessageResponse | undefined> {
    if (this.silence) {
      return;
    }

    logger.info(message);

    const envrionmentSuffix =
      this.environment === Environment.PROD
        ? ''
        : `- ${this.environment.toUpperCase()}`;
    return this.request('/chat.postMessage', 'POST', {
      body: {
        text: `[${formattedDateTimeNow()} ${envrionmentSuffix}] ${message}`,
        channel,
      },
    });
  }
}
