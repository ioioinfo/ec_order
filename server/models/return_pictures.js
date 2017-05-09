var _ = require('lodash');
var EventProxy = require('eventproxy');

var return_pictures = function(server) {
	return {
		//查询单条退单
		search_return_pictures: function(return_id,cb){
			var query = `select id,return_id,location,created_at from return_pictures
			where flag=0 and return_id =?`;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, return_id, function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,results);
						return;
					}
					cb(false,results);
				});
			});
		},

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
