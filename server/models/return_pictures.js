var _ = require('lodash');
var EventProxy = require('eventproxy');

var return_pictures = function(server) {
	return {
		save_return_pricture: function(return_id,location,cb) {
			var query = `insert into return_pictures(id, return_id, location, created_at, updated_at, flag)
			values
			(uuid(), ?, ?, now(), now(), 0)
			`;
			var columns=[return_id,location];
            server.plugins.mysql.query(query, columns, function(err, rows) {
                if (err) {
                    console.log(err);
                    cb(err,null);
                }
                cb(err,rows);
            });
        },

	};
};

module.exports = return_pictures;
