var _ = require('lodash');
var EventProxy = require('eventproxy');

var poor_orders = function(server) {
	return {
        //保存订单信息
        save_order_infos : function(order_id, cb) {
            var query = `insert into poor_orders(id, order_id,created_at,updated_at, flag)
                values
                (uuid(),?,now(),now(),0)` ;
            var columns=[order_id];
            server.plugins['mysql'].pool.getConnection(function(err, connection) {
                connection.query(query, columns, function(err, results) {
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
		//查询
		get_poor_orders :  function(params, cb){
			var query = `select id, order_id from poor_orders
				where flag = 0
			`;
			var colums = [];
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, colums, function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,null);
						return;
					}
					cb(false,results);
				});
			});
		},
		poor_orders_count : function(params,cb){
			var query = `select count(1) num
				from poor_orders
				where flag =0
			`;
			var colums=[];

			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query,colums, function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,null);
						return;
					}
					cb(false,results);
				});
			});
		},





	};
};

module.exports = poor_orders;
