// Base routes for item..
const uu_request = require('../utils/uu_request');
const uuidV1 = require('uuid/v1');
var eventproxy = require('eventproxy');
var service_info = "ec order service"
var do_get_method = function(url,cb){
	uu_request.get(url, function(err, response, body){
		if (!err && response.statusCode === 200) {
			var content = JSON.parse(body);
			cb(false, content);
		} else {
			cb(true, null);
		}
	});
};

var do_post_method = function(data,url,cb){
	uu_request.request(url, data, function(err, response, body) {
		console.log(body);
		if (!err && response.statusCode === 200) {
			cb(false,body);
		} else {
			cb(true,null);
		}
	});
};

exports.register = function(server, options, next){
	var save_order = function(order_id,vip_id,actual_price,marketing_price,pos_id,operation_system,origin,cb){
		server.plugins['models'].orders.save_orders(order_id,vip_id,actual_price,marketing_price,pos_id,operation_system,origin,function(err,results){
			cb(err,results);
		});
	};
	var save_order_details = function(order_id, products, cb){
		server.plugins['models'].order_details.save_order_details(order_id, products, function(err,results){
			cb(err,results);
		});
	};
	server.route([
		//保存订单
		{
			method: 'POST',
			path: '/add_order',
			handler: function(request, reply){
				var actual_price = request.payload.actual_price;
				var marketing_price = request.payload.marketing_price;
				var pos_id = request.payload.pos_id;
				var operation_system = request.payload.operation_system;
				var origin = request.payload.origin;
				var order_id = uuidV1();
				var products = request.payload.products;
				var member = request.payload.member;
				member = JSON.parse(member);
				var vip_id = member.vip_id;
				products = JSON.parse(products);
				save_order(order_id,vip_id,actual_price,marketing_price,pos_id,operation_system,origin,function(err, results){
					if (results.affectedRows>0) {
						for (var i = 0; i < products.length; i++) {
							var product = products[i];
							product.order_index = i+1;
						}
						save_order_details(order_id, products, function(err, results){
							if (results.affectedRows>0) {
								return reply({"success":true,"message":"ok","order_id":order_id,"service_info":service_info});
							}else {
								return reply({"success":false,"message":"add order detail fail","service_info":service_info});
							}
						});

					}else {
						return reply({"success":false,"message":"add order fail","service_info":service_info});
					}
				});
			}
		},



	]);

    next();
};

exports.register.attributes = {
    name: 'order_controller'
};
