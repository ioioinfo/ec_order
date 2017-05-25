var _ = require('lodash');
var EventProxy = require('eventproxy');

var poor_orders = function(server) {
	return {
        //保存订单信息
        save_order_infos : function(order_id, cb) {
            var query = `insert into poor_orders(id, order_id,created_at,updated_at, flag)
                values
                (uuid(),?,now(),now(),0)` ;
            console.log(query);
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
        }


	};
};

module.exports = poor_orders;
