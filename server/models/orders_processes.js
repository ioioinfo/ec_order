var _ = require('lodash');
var EventProxy = require('eventproxy');

var orders_processes = function(server) {
	return {
        save_orders_process : function(order_process, cb) {
            var query = `insert into orders_processes (id, order_id, operation,
                operated_date,  assigner_id, person_id,
                created_at, updated_at, flag)
                values
                (uuid(), ?, ?,
                ?, ?, ?,
                now(), now(), 0)` ;

            var columns=[order_process.order_id, order_process.operation,
                order_process.operated_date, order_process.assigner_id, order_process.person_id
            ];

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
        //订单流程更加订单号
        search_orders_process:  function(order_id, cb){
            var query = `select id, order_id, operation,
                assigner_id, person_id,
                DATE_FORMAT(operated_date,'%Y-%m-%d %H:%i:%S') operated_date,
                DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%S') created_at_text,
                DATE_FORMAT(updated_at,'%Y-%m-%d %H:%i:%S') updated_at_text
                from orders_processes
                where flag =0 and order_id =?
            `;
            server.plugins['mysql'].pool.getConnection(function(err, connection) {
                connection.query(query,[order_id],function(err, results) {
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
        //更新订单流程负责人
        update_orders_process: function(order_process,cb){
            var query = `update orders_processes set operated_date =?, assigner_id =?,
                person_id =?, operation =?, updated_at = now()
                where id =? and flag = 0`

            var columns = [order_process.operated_date, order_process.assigner_id, order_process.person_id,
                order_process.operation, order_process.id];
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




	};
};

module.exports = orders_processes;
