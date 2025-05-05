class Item {
    constructor(
        public title: String,
        public short_name: String,
        public language: String,
        public is_permalink: Boolean,
        public link: String,
        public pub_date: Date,
        public raw_date: String,
        public last_checked: Date,
        public downloads: Number,
        public category: String,
        public category_id: Number,
        public magnet_link: String,
        public size: Number,
        public content_type: String,
        public seeds: Number,
        public peers: Number,
        public type: String,
        public info_hash: String,
        public uploader: String,
        public uploader_link: String
    ) {}
}

export default Item;
