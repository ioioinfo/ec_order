var _ = require('lodash');
var EventProxy = require('eventproxy');

var clothing_customing_orders = function(server) {
	return {
        save_customing_order : function(order, cb) {
			var query = `insert into clothing_customing_orders (id, order_id, origin_order_id, store_id, person_id,
                amount, rest, order_status, seller_id, is_cancel, cancel_reason, discount, order_date, take_date, customer_name, connect_phone, high, weight, sample_size, shoulder_front_width, shoulder_behind_width, clothing_length, sleeve_length, chest_length, shoulder_chest_length, bust, biceps, should_back_length, flat_shoulder, middle_waisted, cuff, weida, bianti, fuwei, qianxiong, gaozhui, aoyao, hips, back, xiongda, off_shoulder, bp_point, qianfugao, beiyuan, yuanti, xiongju, houzhuigao, duzida, aobei, qianyaojie, cezhuigao, houyaojie, xiulongchang, luehesheng, fit, luekuansong, kuansong, x_pants_length, x_zhuigao, x_skirt_length, x_fugao, x_waist, x_huangdang, x_fuwei, x_lidang, x_hips, x_jiaokou,
			    created_at, updated_at, flag)
    			values
                (uuid(), ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?,
			    now(), now(), 0)` ;

			var columns=[order.order_id, order.origin_order_id, order.store_id, order.person_id,
                order.amount, order.rest, order.order_status, order.seller_id, order.is_cancel, order.cancel_reason, order.discount, order.order_date, order.take_date,
                order.customer_name, order.connect_phone, order.high, order.weight, order.sample_size, order.shoulder_front_width, order.shoulder_behind_width,
                order.clothing_length, order.sleeve_length, order.chest_length, order.shoulder_chest_length, order.bust, order.biceps, order.should_back_length,
                order.flat_shoulder, order.middle_waisted, order.cuff, order.weida, order.bianti, order.fuwei, order.qianxiong, order.gaozhui, order.aoyao, order.hips, order.back,
                order.xiongda, order.off_shoulder, order.bp_point, order.qianfugao, order.beiyuan, order.yuanti, order.xiongju, order.houzhuigao, order.duzida, order.aobei,
                order.qianyaojie, order.cezhuigao, order.houyaojie, order.xiulongchang, order.luehesheng, order.fit, order.luekuansong, order.kuansong, order.x_pants_length,
                order.x_zhuigao, order.x_skirt_length, order.x_fugao, order.x_waist, order.x_huangdang, order.x_fuwei, order.x_lidang, order.x_hips, order.x_jiaokou
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
		//获取所有订单根据用户
		search_customing_orders_by_person:  function(person_id, cb){
			var query = `select id, order_id, origin_order_id, store_id, person_id,
                amount, rest, order_status, seller_id, is_cancel, cancel_reason, discount, order_date, take_date, customer_name, connect_phone, high, weight, sample_size, shoulder_front_width, shoulder_behind_width, clothing_length, sleeve_length, chest_length, shoulder_chest_length, bust, biceps, should_back_length, flat_shoulder, middle_waisted, cuff, weida, bianti, fuwei, qianxiong, gaozhui, aoyao, hips, back, xiongda, off_shoulder, bp_point, qianfugao, beiyuan, yuanti, xiongju, houzhuigao, duzida, aobei, qianyaojie, cezhuigao, houyaojie, xiulongchang, luehesheng, fit, luekuansong, kuansong, x_pants_length, x_zhuigao, x_skirt_length, x_fugao, x_waist, x_huangdang, x_fuwei, x_lidang, x_hips, x_jiaokou,
				DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%S') created_at_text,
				DATE_FORMAT(updated_at,'%Y-%m-%d %H:%i:%S') updated_at_text
				from clothing_customing_orders
				where flag =0 and person_id =?
			`;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query,[person_id],function(err, results) {
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

module.exports = clothing_customing_orders;
