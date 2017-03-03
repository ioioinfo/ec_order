const uu_request = require('../utils/uu_request');
const uuidV1 = require('uuid/v1');
var service_info = "ec order service";

var do_get_method = function(url,cb){
	uu_request.get(url, function(err, response, body){
		if (!err && response.statusCode === 200) {
			var content = JSON.parse(body);
			do_result(false, content, cb);
		} else {
			cb(true, null);
		}
	});
};
//所有post调用接口方法
var do_post_method = function(url,data,cb){
	uu_request.request(url, data, function(err, response, body) {
		console.log(body);
		if (!err && response.statusCode === 200) {
			do_result(false, body, cb);
		} else {
			cb(true,null);
		}
	});
};
//处理结果
var do_result = function(err,result,cb){
	if (!err) {
		if (result.success) {
			cb(false,result);
		}else {
			cb(true,result);
		}
	}else {
		cb(true,null);
	}
};
exports.register = function(server, options, next){
	//查询ec  单条order信息
	var get_ec_order = function(order_id,cb){
		server.plugins['models'].products_ec_orders.get_ec_order(order_id,function(err,results){
			cb(err,results);
		});
	};
	server.route([
		//订单物流信息
		{
			method: 'GET',
			path: '/save_order_logistics',
			handler: function(request, reply){
				var order_id = request.query.order_id;
				get_ec_order(order_id,function(err, results){
					if (!err) {
						if (results.length>0) {
							var order = results[0];
							var amount = order.logistics_price;
							server.plugins['models'].order_logistics.save_logistcs_info(order_id,amount,function(err,results){
								if (!err) {
									return reply({"success":true,"message":"ok","service_info":service_info});
								}else {
									return reply({"success":false,"message":rows.message,"service_info":service_info});
								}
							});
						}else {
							return reply({"success":false,"message":"查不到该订单号","service_info":service_info});
						}
					}else {
						return reply({"success":false,"message":rows.message,"service_info":service_info});
					}
				});

			}
		},


	]);

    next();
};

exports.register.attributes = {
    name: 'logistics_controller'
};
