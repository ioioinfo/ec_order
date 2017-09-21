const uu_request = require('../utils/uu_request');
const uuidV1 = require('uuid/v1');
var service_info = "ec order service";
var eventproxy = require('eventproxy');

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
//生成pos单号
var generate_order_no = function(cb){
	var url = "http://211.149.248.241:18011/generate_order_no"
	var data = {
		org_code : "ioio",
		order_type : "online_order"
	};
	do_post_method(url,data,cb);
};
exports.register = function(server, options, next){

	server.route([
		//查询所有
        {
            method: "GET",
            path: '/get_online_orders',
            handler: function(request, reply) {
				var params = request.query.params;
                var info = {};
                if (params) {
                    info = JSON.parse(params);
                }
				var info2 = {};
                var ep =  eventproxy.create("rows", "num",
					function(rows, num){

					return reply({"success":true,"rows":rows,"num":num,"service_info":service_info});
				});
                //查询所有渠道部门
                server.plugins['models'].online_orders.get_online_orders(info,function(err,rows){
                    if (!err) {
						ep.emit("rows", rows);
					}else {
						ep.emit("rows", []);
					}
				});
				server.plugins['models'].online_orders.account_online_orders(info,function(err,rows){
                    if (!err) {
						ep.emit("num", rows[0].num);
					}else {
						ep.emit("num", 0);
					}
				});

            }
        },
		//新增
        {
            method: 'POST',
            path: '/save_online_orders',
            handler: function(request, reply){
                var order = request.payload.order;
                order = JSON.parse(order);
                if (!order.person_id || !order.products_price || !order.total_number || !order.weight || !order.actual_price) {
                    return reply({"success":false,"message":"params wrong","service_info":service_info});
                }
				generate_order_no(function(err,row){
					if (!err) {
						order.order_id = row.order_no;
						var id = uuidV1();
						order.id = id;
						server.plugins['models'].online_orders.save_online_orders(order, function(err,result){
		                    if (result.affectedRows>0) {

								var order_detail = {
									"order_id" : order.order_id,
									"product_id" : 1,
									"order_index" : 1,
									"number" : 1,
									"price" : 1,
									"marketing_price" : 1,
									"total_price" : 1,
									"sku_id": 1
								};
								server.plugins['models'].online_orders_details.save_online_orders_detail(order_detail, function(err,result){
				                    if (result.affectedRows>0) {
				                        return reply({"success":true,"service_info":service_info});
				                    }else {
				                        return reply({"success":false,"message":result.message,"service_info":service_info});
				                    }
				                });
		                    }else {
		                        return reply({"success":false,"message":result.message,"service_info":service_info});
		                    }
		                });
					}else {
						return reply({"success":false,"message":row.message,"service_info":service_info});
					}
				});
            }
        },


	]);

    next();
};

exports.register.attributes = {
    name: 'online_orders_controller'
};
