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
exports.register = function(server, options, next){
	//查询ec  单条order信息
	var get_ec_order = function(order_id,cb){
		server.plugins['models'].products_ec_orders.get_ec_order(order_id,function(err,results){
			cb(err,results);
		});
	};
	server.route([
		//退单完成 finish_return_order
		{
			method: 'POST',
			path: '/finish_return_order',
			handler: function(request, reply){
				var id = request.payload.id;
				if (!id) {
					return reply({"success":false,"message":"param null"});
				}
				server.plugins['models'].return_orders_details.search_return_order(id,function(err,results){
					if (!err) {
						if (results.length ==0) {
							return reply({"success":false,"message":"no found data","service_info":service_info});
						}
						var return_order = results[0];
						var order_id = return_order.order_id;
						var order_status = 10;
						var status =5;
						var ep =  eventproxy.create("order_status","return_status",function(order_status,return_status){
							if (order_status == 0 && return_status==0) {
								return reply({"success":false,"message":"order and return no change","service_info":service_info});
							}
							if (order_status == 0) {
								return reply({"success":false,"message":"order no change","service_info":service_info});
							}
							if (return_status == 0) {
								return reply({"success":false,"message":"return no change","service_info":service_info});
							}
							return reply({"success":true,"service_info":service_info});
						});
						server.plugins['models'].ec_orders.update_order_status(order_id,order_status,function(err,results){
							if (results.affectedRows>0) {
								ep.emit("order_status",1);
							}else {
								ep.emit("order_status",0);
							}
						});

						server.plugins['models'].return_orders_details.update_return_status(id,status,function(err,results){
							if (results.affectedRows>0) {
								ep.emit("return_status",1);
							}else {
								ep.emit("return_status",0);
							}
						});


					}else {
						return reply({"success":false,"message":results.message,"service_info":service_info});
					}
				});
			}
		},
		//退货单明细
		{
			method: 'GET',
			path: '/search_return_order',
			handler: function(request, reply){
				var id = request.query.id;
				if (!id) {
					return reply({"success":false,"message":"param null"});
				}
                server.plugins['models'].return_orders_details.search_return_order(id,function(err,results){
                    if (!err) {
						var return_order = results[0];
						server.plugins['models'].return_pictures.search_return_pictures(id,function(err,results){
		                    if (!err) {
								var imgs = [];
								for (var i = 0; i < results.length; i++) {
									imgs.push(results[i].location);
								}
								return_order.imgs=imgs;
								return reply({"success":true,"row":return_order,"service_info":service_info});
		                    }else {
		                        return reply({"success":false,"message":results.message,"service_info":service_info});
		                    }
		                });
                    }else {
                        return reply({"success":false,"message":results.message,"service_info":service_info});
                    }
                });
			}
		},
		//退货单列表 以及个人的
		{
			method: 'GET',
			path: '/search_return_list',
			handler: function(request, reply){
				var person_id = "";
				if (request.query.person_id) {
					person_id = request.query.person_id;
				}
                server.plugins['models'].return_orders_details.search_return_list(person_id,function(err,results){
                    if (!err) {
                        return reply({"success":true,"rows":results,"service_info":service_info});
                    }else {
                        return reply({"success":false,"message":results.message,"service_info":service_info});
                    }
                });
			}
		},
		//退单申请
		{
			method: 'POST',
			path: '/create_return_apply',
			handler: function(request, reply){
                var id = uuidV1();
                var order_id = request.payload.order_id;
				var person_id = request.payload.person_id;
				var product_id = request.payload.product_id;
				var return_reason = request.payload.return_reason;
				var number = request.payload.number;
                var imgs = request.payload.imgs;
                if (!order_id || !person_id || !product_id || !return_reason || !number || !imgs) {
					return reply({"success":false,"message":"param null"});
				}
                server.plugins['models'].return_orders_details.create_return_apply(id,order_id,person_id,product_id,return_reason,number,function(err,results){
                    if (results.affectedRows>0) {
                        imgs = JSON.parse(imgs);
                        for (var i = 0; i < imgs.length; i++) {
                            var img = imgs[i];
                            server.plugins['models'].return_pictures.save_return_pricture(id,img,function(err,results){
                                if (results.affectedRows>0) {
                                }else {
                                    return reply({"success":false,"message":results.message,"service_info":service_info});
                                }
                    		});
                        }
                        return reply({"success":true,"id":id,"service_info":service_info});
                    }else {
                        return reply({"success":false,"message":results.message,"service_info":service_info});
                    }
                });
			}
		},
        //修改退单状态
		{
			method: 'POST',
			path: '/update_return_status',
			handler: function(request, reply){
                var id = request.payload.id;
                var status = request.payload.status;
                if (!id || !status) {
					return reply({"success":false,"message":"param null"});
				}
                server.plugins['models'].return_orders_details.update_return_status(id,status,function(err,results){
                    if (results.affectedRows>0) {
                        return reply({"success":true,"service_info":service_info});
                    }else {
                        return reply({"success":false,"message":results.message,"service_info":service_info});
                    }
                });
			}
		},

	]);

    next();
};

exports.register.attributes = {
    name: 'return_controller'
};
