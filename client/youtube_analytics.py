import requests
import logging

logger = logging.getLogger(__name__)

def fetch_channel_analytics(access_token, start_date, end_date):
    """
    Fetches YouTube channel performance reports for the authenticated channel.
    Metrics requested: views, likes, comments, shares, subscribersGained, estimatedMinutesWatched
    """
    url = "https://youtubeanalytics.googleapis.com/v2/reports"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json"
    }
    params = {
        "ids": "channel==MINE",
        "startDate": start_date,
        "endDate": end_date,
        "metrics": "views,likes,comments,shares,subscribersGained,estimatedMinutesWatched",
    }

    logger.info(f"Fetching YouTube analytics from {start_date} to {end_date}")
    response = requests.get(url, headers=headers, params=params, timeout=30)
    
    try:
        response.raise_for_status()
    except requests.HTTPError as error:
        logger.error(f"YouTube Analytics API error: {response.text}")
        raise requests.HTTPError(
            f"Failed to fetch YouTube analytics: {error} - response: {response.text}"
        ) from error

    data = response.json()
    
    # Process rows to return a cleaner structure
    # The response schema usually consists of:
    # {
    #   "columnHeaders": [{"name": "views", "columnType": "METRIC", "dataType": "INTEGER"}, ...],
    #   "rows": [[1500, 25, 10, 5, 2, 450]]
    # }
    headers_list = [header.get("name") for header in data.get("columnHeaders", [])]
    rows = data.get("rows", [])
    
    result = {}
    if rows and len(rows) > 0:
        # Sum up all metrics across the rows/days returned
        row_data = rows[0]  # If queried without dimensions, it returns a single row with total aggregates
        for idx, name in enumerate(headers_list):
            result[name] = row_data[idx]
    else:
        # Defaults if no data/rows returned
        for name in ["views", "likes", "comments", "shares", "subscribersGained", "estimatedMinutesWatched"]:
            result[name] = 0

    return result


def fetch_realtime_channel_stats(access_token):
    """
    Fetches real-time YouTube channel statistics (views, subscribers, videos)
    using the YouTube Data API channels endpoint.
    """
    url = "https://www.googleapis.com/youtube/v3/channels"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json"
    }
    params = {
        "part": "statistics",
        "mine": "true"
    }
    
    logger.info("Fetching real-time YouTube channel statistics")
    response = requests.get(url, headers=headers, params=params, timeout=30)
    
    try:
        response.raise_for_status()
        data = response.json()
        items = data.get("items", [])
        if items:
            stats = items[0].get("statistics", {})
            return {
                "realtime_views": int(stats.get("viewCount", 0)),
                "realtime_subscribers": int(stats.get("subscriberCount", 0)),
                "realtime_videos": int(stats.get("videoCount", 0))
            }
    except Exception as e:
        logger.error(f"Error fetching real-time channel stats: {e}")
        
    return {}
