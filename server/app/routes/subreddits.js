const express = require('express');
const router = express.Router();
const models = require('../../db/models');
const async = require('async');
const Subreddit = models.Subreddit;

/*
returns the top 5 recommended subreddits
  The req body will have:
    a list of subscribed subreddits
    a list of blacklisted subreddits (unwanted)
  The res body will have:
    a list of the top 5 recommended
*/
router.get('/recommended', function (req, res, next) {

  Subreddit.getTagsBySubreddit(req.body.subreddits)
  .exec(function (err, res) {
    return res
  })
  .then(tags => {
    print("tags after getting them from every Subreddit: " + tags);
    // we then need to process the output from the query helper into
    // a flat array of tag objects with distance and name values
    var tags = tags.map(element => element.tags)
          .reduce((a, b) => a.concat(b), []);
    return tags
  }).then(list => {

    list = list.concat(req.body.tags);
    print("tags after concating them with req.body.tags: " + list);
    return Subreddit.getSubredditsByTags(req.body.blacklist, tags);
  }).then(recSubreddits => {
    res.status(200);
    res.json(recSubreddits);
  })
  .catch(next);
});


module.exports = router;
