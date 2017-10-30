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

	server.route([
		//保存样品订单
		{
			method: 'POST',
			path: '/save_sample_order',
			handler: function(request, reply){
				var order = request.payload.order;
                order = JSON.parse(order);
                // order = {
                //     "order_id" : "001",
                //     "origin_order_id" : "o001",
                //     "store_id" : "s001",
                //     "person_id" : "p001",
                //     "amount" : 10000,
                //     "rest" : 1000,
                //     "order_status" : 0,
                //     "seller_id" : "s001",
                //     "is_cancel" : 0,
                //     "order_date" : "2017-10-25 15:55:00",
                //     "take_date" : "2017-11-25 15:55:00",
                //     "customer_name" : "李大雷",
                //     "connect_phone" : "021-36220311",
                //     "high" : "177cm",
                //     "weight" : "80KG",
                //     "sample_size" : "42size"
                // }

                server.plugins['models'].samples_clothing_orders.save_sample_order(order,function(err,result){
                    if (!err) {
                        return reply({"success":true,"message":"ok","service_info":service_info});
                    }else {
                        return reply({"success":false,"message":result.message,"service_info":service_info});
                    }
                });
			}
		},
        //保存订制订单
        {
            method: 'POST',
            path: '/save_customing_order',
            handler: function(request, reply){
                var order = request.payload.order;
                order = JSON.parse(order);
                server.plugins['models'].clothing_customing_orders.save_customing_order(order,function(err,result){
                    if (!err) {
                        return reply({"success":true,"message":"ok","service_info":service_info});
                    }else {
                        return reply({"success":false,"message":result.message,"service_info":service_info});
                    }
                });
            }
        },
        //获取所有订制订单根据用户
        {
            method: 'GET',
            path: '/search_customing_orders_by_person',
            handler: function(request, reply){
                var person_id = request.query.person_id;
                if (!person_id) {
                    return reply({"success":false,"message":"person_id null","service_info":service_info});
                }
                server.plugins['models'].clothing_customing_orders.search_customing_orders_by_person(person_id,function(err,rows){
                    if (!err) {
                        return reply({"success":true,"rows":rows,"service_info":service_info});
                    }else {
                        return reply({"success":false,"message":rows.message,"service_info":service_info});
                    }
                });
            }
        },
        //获取所有样品订单根据用户
        {
            method: 'GET',
            path: '/search_samples_orders_by_person',
            handler: function(request, reply){
                var person_id = request.query.person_id;
                if (!person_id) {
                    return reply({"success":false,"message":"person_id null","service_info":service_info});
                }
                server.plugins['models'].samples_clothing_orders.search_samples_orders_by_person(person_id,function(err,rows){
                    if (!err) {
                        return reply({"success":true,"rows":rows,"service_info":service_info});
                    }else {
                        return reply({"success":false,"message":rows.message,"service_info":service_info});
                    }
                });
            }
        },
		//订制订单删除
		{
			method: 'POST',
			path: '/customing_order_delete',
			handler: function(request, reply){
				var order_id = request.payload.order_id;
				if (!order_id) {
                    return reply({"success":false,"message":"order_id null","service_info":service_info});
                }
				server.plugins['models'].clothing_customing_orders.customing_order_delete(order_id,function(err,result){
					if (!err) {
						return reply({"success":true,"message":"ok","service_info":service_info});
					}else {
						return reply({"success":false,"message":result.message,"service_info":service_info});
					}
				});
			}
		},
		//样品订单删除
		{
			method: 'POST',
			path: '/sample_order_delete',
			handler: function(request, reply){
				var order_id = request.payload.order_id;
				if (!order_id) {
                    return reply({"success":false,"message":"order_id null","service_info":service_info});
                }
				server.plugins['models'].samples_clothing_orders.sample_order_delete(order_id,function(err,result){
					if (!err) {
						return reply({"success":true,"message":"ok","service_info":service_info});
					}else {
						return reply({"success":false,"message":result.message,"service_info":service_info});
					}
				});
			}
		},
		//订单样图保存
		{
            method: 'POST',
            path: '/save_order_picture',
            handler: function(request, reply){
				var order_id = request.payload.order_id;
				var img_location = request.payload.img_location;
				if (!order_id || !img_location) {
                    return reply({"success":false,"message":"order_id or img_location null","service_info":service_info});
                }
                server.plugins['models'].orders_pictures.save_order_picture(order_id,img_location,function(err,result){
                    if (!err) {
                        return reply({"success":true,"message":"ok","service_info":service_info});
                    }else {
                        return reply({"success":false,"message":result.message,"service_info":service_info});
                    }
                });
            }
        },
		//查询订单图片根据订单号
		{
			method: 'GET',
			path: '/search_order_picture',
			handler: function(request, reply){
				var order_id = request.query.order_id;
				if (!order_id) {
                    return reply({"success":false,"message":"order_id null","service_info":service_info});
                }
				server.plugins['models'].orders_pictures.search_order_picture(order_id,function(err,rows){
					if (!err) {
						return reply({"success":true,"rows":rows,"service_info":service_info});
					}else {
						return reply({"success":false,"message":rows.message,"service_info":service_info});
					}
				});
			}
		},
		//订单样图修改
		{
			method: 'POST',
			path: '/update_order_picture',
			handler: function(request, reply){
				var order_id = request.payload.order_id;
				var img_location = request.payload.img_location;
				if (!order_id || !img_location) {
					return reply({"success":false,"message":"order_id or img_location null","service_info":service_info});
				}
				server.plugins['models'].orders_pictures.update_order_picture(order_id,img_location,function(err,result){
					if (!err) {
						return reply({"success":true,"message":"ok","service_info":service_info});
					}else {
						return reply({"success":false,"message":result.message,"service_info":service_info});
					}
				});
			}
		},
		//订单样图删除
		{
			method: 'POST',
			path: '/order_picture_delete',
			handler: function(request, reply){
				var order_id = request.payload.order_id;
				if (!order_id) {
					return reply({"success":false,"message":"order_id null","service_info":service_info});
				}
				server.plugins['models'].orders_pictures.order_picture_delete(order_id,function(err,result){
					if (!err) {
						return reply({"success":true,"message":"ok","service_info":service_info});
					}else {
						return reply({"success":false,"message":result.message,"service_info":service_info});
					}
				});
			}
		},



	]);

    next();
};

exports.register.attributes = {
    name: 'clothing_orders_controller'
};
