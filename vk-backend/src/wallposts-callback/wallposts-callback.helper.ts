export function addIdToPostponedPostText(text: string, unpublishedTag: string, postId: number) {
  return text.split(unpublishedTag).join(`${unpublishedTag}_${postId}`);
}
