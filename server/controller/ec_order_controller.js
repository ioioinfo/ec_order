// Base routes for item..
const uu_request = require('../utils/uu_request');
const uuidV1 = require('uuid/v1');
var eventproxy = require('eventproxy');
var service_info = "ec order service";
var order_status = {
	"0" : "付款确认中",
	"1" : "买家已付款",
	"2" : "等待卖家发货",
	"3" : "卖家已发货",
	"4" : "等待买家收货",
	"5" : "交易成功",
	"6" : "交易关闭",
	"7" : "退款中订单",
	"8" : "等待买家评价"
};

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
	//查询ec所有订单
	var get_ec_orders = function(cb){
		server.plugins['models'].products_ec_orders.get_ec_orders(function(err,results){
			cb(err,results);
		});
	};
	//查询ec  单条order信息
	var get_ec_order = function(order_id,cb){
		server.plugins['models'].products_ec_orders.get_ec_order(order_id,function(err,results){
			cb(err,results);
		});
	};
	//查询ec所有明细
	var get_ec_all_details = function(order_ids,cb){
		server.plugins['models'].products_ec_orders_details.search_ec_order_details(order_ids,function(err,results){
			cb(err,results);
		});
	};
	//批量查询商品信息
	var find_products_with_picture = function(product_ids,cb){
		var url = "http://127.0.0.1:18002/find_products_with_picture?product_ids="+product_ids;
		do_get_method(url,cb);
	};
	//查询订单地址信息
	var search_order_address = function(person_id,cb){
		server.plugins['models'].order_addresses.search_order_address(person_id,function(err,results){
			cb(err,results);
		});
	};
	//查询物流号
	var search_logistics_id = function(order_id,cb){
		server.plugins['models'].order_logistics.get_logistics_id(order_id,function(err,results){
			cb(err,results);
		});
	};
	//查询最新物流信息
	var search_logistics_info = function(logistics_id,cb){
		var url = "http://211.149.248.241:18013/logistics/get_latest_by_order?logistics_id="+logistics_id;
		do_get_method(url,cb);
	};
	//查询物流信息全
	var search_logistics_infos = function(logistics_id,cb){
		var url = "http://211.149.248.241:18013/logistics/list_by_order?logistics_id="+logistics_id;
		do_get_method(url,cb);
	};
	//更新订单状态
	var update_order_status = function(order_id,order_status,cb){
		server.plugins['models'].products_ec_orders.update_order_status(order_id,order_status,function(err,results){
			cb(err,results);
		});
	};
	//更新收货时间
	var updata_receive_time = function(order_id,cb){
		server.plugins['models'].order_logistics.update_receive_time(order_id,function(err,results){
			cb(err,results);
		});
	};
	//开票信息
	var search_ec_invoices = function(person_id,order_id,cb){
		server.plugins['models'].normal_invoices.search_ec_invoices(person_id,order_id,function(err,results){
			cb(err,results);
		});
	};
	server.route([
		//得到所有订单
		{
			method: 'GET',
			path: '/get_ec_orders',
			handler: function(request, reply){
				get_ec_orders(function(err, results){
					if (!err) {
						var order_ids = [];
						for (var i = 0; i < results.length; i++) {
							order_ids.push(results[i].order_id);
							results[i].order_status = order_status[results[i].order_status];
						}
						get_ec_all_details(order_ids,function(error,content){
							console.log(content);
							if (!error) {
								var order_map = {};
								var product_ids = [];
								for (var i = 0; i < content.length; i++) {
									var order_detail = content[i];
									product_ids.push(order_detail.product_id);

									//判断order_map是否有order_id
									if (order_map[order_detail.order_id]) {
										//2.有的话 order_map放入 details 里面
										var order_details = order_map[order_detail.order_id];
										//传址！
										order_details.push(order_detail);
									} else {
										// 1.没有的话
										var order_details = [];
										order_details.push(order_detail);
										//order_id 对应 明细
										order_map[order_detail.order_id] = order_details;
									}
								}
								console.log("order_map:"+JSON.stringify(order_map));
								product_ids = JSON.stringify(product_ids);
								find_products_with_picture(product_ids,function(err, rows){
									console.log("row:"+JSON.stringify(rows));
									if (!err) {
										var products = rows.products;
										var products_map = {};
										for (var i = 0; i < products.length; i++) {
											var product = products[i];
											products_map[product.id] = product;
										}
										return reply({"success":true,"message":"ok","orders":results,"details":order_map,"products":products_map,"service_info":service_info});
									}else {
										console.log("err:"+err);
										return reply({"success":false,"message":results});
									}
								});
							}else {
								return reply({"success":false,"message":results});
							}
						});
					}else {
						return reply({"success":false,"message":results});
					}
				});
			}
		},
		//根据order_id 获取信息订单信息
		{
			method: 'GET',
			path: '/get_ec_order',
			handler: function(request, reply){
				var order_id = request.query.order_id;
				if (!order_id) {
					return reply({"success":false,"message":"params wrong","service_info":service_info})
				}
				get_ec_order(order_id,function(err, results){
					if (!err) {
						var order_ids = [];
						for (var i = 0; i < results.length; i++) {
							order_ids.push(results[i].order_id);
							results[i].order_status = order_status[results[i].order_status];
						}
						get_ec_all_details(order_ids,function(error,content){
							console.log(content);
							if (!error) {
								var order_map = {};
								var product_ids = [];
								for (var i = 0; i < content.length; i++) {
									var order_detail = content[i];
									product_ids.push(order_detail.product_id);

									//判断order_map是否有order_id
									if (order_map[order_detail.order_id]) {
										//2.有的话 order_map放入 details 里面
										var order_details = order_map[order_detail.order_id];
										//传址！
										order_details.push(order_detail);
									} else {
										// 1.没有的话
										var order_details = [];
										order_details.push(order_detail);
										//order_id 对应 明细
										order_map[order_detail.order_id] = order_details;
									}
								}
								console.log("order_map:"+JSON.stringify(order_map));
								product_ids = JSON.stringify(product_ids);
								find_products_with_picture(product_ids,function(errs, rows){
									console.log("row:"+JSON.stringify(rows));
									if (!errs) {
										var products = rows.products;
										var products_map = {};
										for (var i = 0; i < products.length; i++) {
											var product = products[i];
											products_map[product.id] = product;
										}
										return reply({"success":true,"message":"ok","orders":results,"details":order_map,"products":products_map,"service_info":service_info});
									}else {
										console.log("err:"+errs);
										return reply({"success":false,"message":errs,"service_info":service_info});
									}
								});
							}else {
								return reply({"success":false,"message":error,"service_info":service_info});
							}
						});
					}else {
						return reply({"success":false,"message":err,"service_info":service_info});
					}
				});
			}
		},
		//订单地址查询
		{
			method: 'GET',
			path: '/search_order_address',
			handler: function(request, reply){
				var person_id = request.query.person_id;
				if (!person_id) {
					return reply({"success":false,"message":"params wrong","service_info":service_info})
				}
				search_order_address(person_id, function(err,result){
					if (!err) {
						return reply({"success":true,"address":result,"service_info":service_info})
					}else {
						return reply({"success":false,"message":err,"service_info":service_info})
					}
				});
			}
		},
		//查询最近物流情况
		{
			method: 'GET',
			path: '/search_laster_logistics',
			handler: function(request, reply){
				var order_id = request.query.order_id;
				if (!order_id) {
					return reply({"success":false,"message":"params wrong","service_info":service_info})
				}
				search_logistics_id(order_id,function(err,results){
					if (!err) {
						if (results.length ==0) {
							return reply({"success":false,"message":"no data","service_info":service_info})
						}
						var logistics_id = results[0].logistics_id;
						search_logistics_info(logistics_id,function(err,results){
							if (!err) {
								return reply({"success":true,"row":results.row,"service_info":service_info});
							}else {

							}
						});
					}else {

					}
				});
			}
		},
		//查询物流信息
		{
			method: 'GET',
			path: '/search_logistics_info',
			handler: function(request, reply){
				var order_id = request.query.order_id;
				if (!order_id) {
					return reply({"success":false,"message":"params wrong","service_info":service_info})
				}
				search_logistics_id(order_id,function(err,results){
					if (!err) {
						if (results.length ==0) {
							return reply({"success":false,"message":"no data","service_info":service_info})
						}
						var order_logistics = results[0];
						var logistics_id = results[0].logistics_id;
						search_logistics_infos(logistics_id,function(err,results){
							if (!err) {
								return reply({"success":true,"rows":results.rows,"order_logistics":order_logistics,"service_info":service_info});
							}else {

							}
						});
					}else {

					}
				});
			}
		},
		//确认收货
		{
			method: 'GET',
			path: '/receive_goods_operations',
			handler: function(request, reply){
				var order_id = request.query.order_id;
				var order_status = 5;
				update_order_status(order_id,order_status,function(err,result){
					if (!err) {
						updata_receive_time(order_id,function(err,result){
							if (!err) {
								return reply({"success":true,"service_info":service_info});
							}else {
							}
						});
					}else {
					}
				});

			}
		},
		//开票信息
		{
			method: 'GET',
			path: '/search_ec_invoices',
			handler: function(request, reply){
				var order_id = JSON.parse(request.query.order_id);
				var person_id = request.query.person_id;
				search_ec_invoices(person_id,order_id,function(err,result){
					console.log("result:"+JSON.stringify(result));
					if (!err) {
						return reply({"success":true,"result":result,"service_info":service_info});
					}else {

					}
				});
			}
		},

	]);

    next();
};

exports.register.attributes = {
    name: 'ec_order_controller'
};
