var _ = require('lodash');
var EventProxy = require('eventproxy');

var orders_pictures = function(server) {
	return {
        save_order_picture : function(order_id,img_location, cb) {
            var query = `insert into orders_pictures (id, order_id, img_location,
                created_at, updated_at, flag)
                values
                (uuid(), ?, ?,
                now(), now(), 0)` ;

            var columns=[order_id,img_location];
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
        //查询订单图片根据订单号
        search_order_picture:  function(order_id, cb){
            var query = `select id, order_id, img_location,
                DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%S') created_at_text,
                DATE_FORMAT(updated_at,'%Y-%m-%d %H:%i:%S') updated_at_text
                from orders_pictures
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
        //更新订单图片
        update_order_picture: function(order_id,img_location,cb){
            var query = "update orders_pictures set img_location =? where order_id =? and flag = 0"

            var columns = [img_location,order_id];
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
        //删除订单图片
        order_picture_delete : function(order_id,cb){
            var query = `update orders_pictures set flag = 1, updated_at = now()
            where order_id = ? and flag =0`;
            server.plugins['mysql'].query(query,[order_id], function(err, results) {
                if (err) {
                    console.log(err);
                    cb(true,results);
                    return;
                }
                cb(false,results);
            });
        },



	};
};

module.exports = orders_pictures;
