interface IWallPost {
  group_id: number;
  type: string;
  event_id: string;
  v: string;
  object: {
    can_edit: number;
    created_by: number;
    can_delete: number;
    donut: { is_donut: boolean };
    comments: { count: number };
    marked_as_ads: number;
    short_text_rate: number;
    compact_attachments_before_cut: number;
    hash: string;
    type: string;
    attachments: IAttachments[];
    date: number;
    from_id: number;
    id: number;
    is_favorite: boolean;
    owner_id: number;
    post_type: 'suggest' | 'post';
    signer_id: number;
    text: string;
  };
}

interface IAttachments {
  type: string;
  doc: {
    id: number;
    owner_id: number;
    title: string;
    size: number;
    ext: string;
    date: number;
    type: number;
    url: string;
    preview: {};
    is_unsafe: number;
    access_key: string;
  };
  style: string;
}

interface ITgToVkCachedData {
  vkPostId: number;
  text: string;
}

interface DelayedDeletionPostMsg {
  telegramPostId: number;
}
