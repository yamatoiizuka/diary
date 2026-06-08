# iOS Shortcuts CMS Guide

This project treats each diary post as its own JSON file. Shortcuts should not update `src/data/entries.json` for new writes.

## Entry Shape

```json
{
  "id": "2026-06-08T14-23-11-0900",
  "date": "2026-06-08",
  "createdAt": "2026-06-08T14:23:11+09:00",
  "updatedAt": "2026-06-08T14:23:11+09:00",
  "text": "本文",
  "image": "2026-06-08T14-23-11-0900"
}
```

Use `date` only for calendar display. Use `id` for edit, delete, image lookup, and DOM integration.

## Create

1. Generate a unique `id`, for example `yyyy-MM-dd'T'HH-mm-ss-SSSZZZZZ`.
2. Replace filename-unsafe `:` characters with `-`.
3. `PUT /repos/{owner}/{repo}/contents/src/data/images/${id}.jpg`.
4. `PUT /repos/{owner}/{repo}/contents/src/data/entries/${id}.json`.
5. Do not update `src/data/entries.json`.

Create does not update a central index, so two quick posts write different files and do not overwrite each other.

## Edit

1. Read the active `id` from `document.title` (`diary:${id}`), `document.documentElement.dataset.diaryActiveId`, or the `#diary-active-entry` JSON script.
2. `GET /repos/{owner}/{repo}/contents/src/data/entries/${id}.json?ref=main`.
3. Use the `content` and `sha` from that same response.
4. Base64 decode `content`, parse JSON, and update only `text` and `updatedAt`.
5. Base64 encode the updated JSON and `PUT` it with the `sha` from step 2.
6. If GitHub returns `409`, fetch the latest file again and ask the user to re-edit. Do not automatically re-send the stale text.

The page DOM is only a target identifier source. Do not use page text as the edit placeholder. Fetch the current entry JSON from GitHub Contents API.

## Delete

1. Read the active `id`.
2. `GET` `src/data/entries/${id}.json` and use that response's `sha` to `DELETE` the entry file.
3. If deleting the image too, `GET` `src/data/images/${image}.jpg` and use that response's `sha` to `DELETE` the image.
4. Delete the entry and image sequentially.
5. If a later step fails, show the partial state, such as `entry deleted / image delete failed`.

## Do Not

- Do not combine JSON from `download_url` or a raw URL with a `sha` from a separate Contents API request.
- Do not use page text as the edit placeholder source.
- Do not identify edit targets by `date` alone.
- Do not ignore stale `409` responses.
