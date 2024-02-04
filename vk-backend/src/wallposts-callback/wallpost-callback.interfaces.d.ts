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
    text: string;
  };
}

interface IAttachments {
  type: string;
  doc: {
    id: 665441350;
    owner_id: 30152694;
    title: string;
    size: 9581662;
    ext: string;
    date: 1690130819;
    type: 3;
    url: string;
    preview: {};
    is_unsafe: 0;
    access_key: string;
  };
  style: string;
}

interface MyInputFile {
  path: string;
}
