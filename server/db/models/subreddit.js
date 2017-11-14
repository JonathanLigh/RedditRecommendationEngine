const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subredditSchema = new Schema({
    url: {
        type: String,
        required: true,
        unique: true
    },
    tags: [{
        name: {
            type: String,
            required: false
        },
        distance: {
            type: Number,
            required: false,
        }
    }],
    numSubscribers: {
        type: Number,
        required: false
    },
    _relatedSubreddits: [{
        type: String
    }]
});

/*
we do not use ES6 arrow functions here because it prevents binding with "this"
ref: http://mongoosejs.com/docs/guide.html
takes:
  subredditNames
returns:
  the query for finding each
*/
subredditSchema.query.getTagsBySubreddits = function(names) {
    return this.find({
        url: {
            $in: names
        }
    }).select('tags')
}

/*
takes:
  list of subreddit names to exclude +
  list of tag names which will be the conjugate of
returns:
  query to be executed that will return the most related subreddits
*/

subredditSchema.query.getSubredditsByTags = function(excludedSRNames, tagNames) {

    return this.find({
        url: {
            "$nin": excludedSRNames
        },
        tags: [{
            name: {
                $in: tagNames
            },
            distance: {
                $leq: 5
            } //arbitrary number, can be tweeked
        }],
        numSubscribers: {
            $geq: 500
        } //arbitrary number, can be tweeked
    }).
    select('url')
}

module.exports = mongoose.model('Subreddit', subredditSchema);
