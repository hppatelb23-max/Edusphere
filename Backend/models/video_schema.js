const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema({

    video_url: [{type: String}],

    image_url: [{type: String}],

    course_id: 
    {
        type: mongoose.Schema.ObjectId, ref: 'Courses'
    }, 

    updated_at: 
    {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Video = mongoose.model("Videos", VideoSchema);

module.exports = Video;