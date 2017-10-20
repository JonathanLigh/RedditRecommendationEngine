var fileSystem = require('fs');
var ProgressBar = require('console-progress');
var Heap = require('heap');

module.exports = {
    getAllTags: function() {
        var tags = [];
        var parsedSubreddits = fileSystem.readdirSync("./parsed_subreddits/");

        console.log("Searching " + parsedSubreddits.length + " subreddits\n");

        var progressBarScale = 1000;
        var bar = ProgressBar.getNew('[:bar]', {
            complete: '=',
            incomplete: ' ',
            width: 40,
            total: parsedSubreddits.length / progressBarScale
        });

        var index;
        for (index in parsedSubreddits) {
            var subreddit = JSON.parse(fileSystem.readFileSync("./parsed_subreddits/" + parsedSubreddits[index]));
            var i;
            for (i in subreddit.tags) {
                var tag = subreddit.tags[i].tag;
                if (tags.indexOf(tag) === -1) {
                    tags.push(tag);
                }
            }
            if (index % progressBarScale === 0) {
                bar.tick();
            }
        }
        console.log(tags);
        return "Total: " + tags.length;
    },
    getRankedSubredditsForTags: function(maxValues) {
        if (arguments.length < 2) {
            return "Provide at least 1 tag";
        }

        // ASSUMING ALL TAGS PROVIDED ARE VALID
        var searchTags = [];
        var index;
        for (index = 1; index < arguments.length; index++) {
            searchTags.push(arguments[index]);
        }

        function getMatchingTags(tags) {
            var matchingTags = [];
            var i;
            for (i in tags) {
                var tag = tags[i];
                if (searchTags.indexOf(tag.tag) !== -1) {
                    //console.log()
                    matchingTags.push(tag);
                }
                if (matchingTags.length === searchTags.length) {
                    return matchingTags;
                }
            }
            return matchingTags;
        }

        function getMentionDistanceSum(tags) {
            var sum = 0;
            var i;
            for (i in tags) {
                sum += tags[i].mentionDistance;
            }
            return sum;
        }

        function getMinMentionDistance(tags) {
            var min = Number.MAX_VALUE;
            var i;
            for (i in tags) {
                if (min > tags[i].mentionDistance) {
                    min = tags[i].mentionDistance;
                }
            }
            return min;
        }

        var heap = new Heap(function(subreddit1, subreddit2) {
            //console.log("Subreddit1:");
            var subreddit1Tags = getMatchingTags(subreddit1.tags);
            //console.log("Subreddit2:" + subreddit2Tags);
            var subreddit2Tags = getMatchingTags(subreddit2.tags);

            var tagDifference = subreddit2Tags.length - subreddit1Tags.length;
            if (tagDifference !== 0) {
                //console.log("Result: " + tagDifference);
                return tagDifference;
            }

            var tagSumDifference = getMentionDistanceSum(subreddit1Tags) - getMentionDistanceSum(subreddit2Tags);
            if (tagSumDifference !== 0) {
                //console.log("Result: " + tagSumDifference);
                return tagSumDifference;
            }

            var tagMinDifference = getMinMentionDistance(subreddit1Tags) - getMinMentionDistance(subreddit2Tags);
            if (tagMinDifference !== 0) {
                //console.log("Result: " + tagMinDifference);
                return tagMinDifference;
            }

            // Popularity difference
            //console.log("Result: " + (subreddit1.total_subscribers - subreddit2.total_subscribers));
            return subreddit2.total_subscribers - subreddit1.total_subscribers;
        });

        var parsedSubreddits = fileSystem.readdirSync("./parsed_subreddits/");

        var progressBarScale = 1000;
        var bar = ProgressBar.getNew('[:bar]', {
            complete: '=',
            incomplete: ' ',
            width: 40,
            total: parsedSubreddits.length / progressBarScale
        });

        var stop = 0;
        for (index in parsedSubreddits) {
            var subreddit = JSON.parse(fileSystem.readFileSync("./parsed_subreddits/" + parsedSubreddits[index]));
            heap.push(subreddit);
            if (index % progressBarScale === 0) {
                bar.tick();
            }
        }

        var output = [];
        for (index = 0; index < maxValues; index++) {
            if (heap.empty()) {
                return output;
            }
            var subreddit = heap.pop();
            var subredditTagsMatched = getMatchingTags(subreddit.tags);
            output.push({
                subreddit: subreddit.url,
                rank: index,
                tagsMatched: subredditTagsMatched.length,
                tagScore: getMentionDistanceSum(subredditTagsMatched),
                depth: getMinMentionDistance(subredditTagsMatched)
            });
        }
        return output;
    }
};

require('make-runnable/custom')({
    printOutputFrame: false
});
