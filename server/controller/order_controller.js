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
	var save_order = function(order_id,vip_id,actual_price,marketing_price,pos_id,operation_system,origin,pay_way,store_id,small_change,cb){
		server.plugins['models'].orders.save_orders(order_id,vip_id,actual_price,marketing_price,pos_id,operation_system,origin,pay_way,store_id,small_change,function(err,results){
			cb(err,results);
		});
	};
	var save_order_details = function(order_id, products, cb){
		server.plugins['models'].order_details.save_order_details(order_id, products, function(err,results){
			cb(err,results);
		});
	};
	//保存付款方式
	var save_pay_way = function(order_id,serial_number,person_id,pay_way,pay_amount,cb){
		server.plugins['models'].pay_ways.save_pay_way(order_id,serial_number,person_id,pay_way,pay_amount,function(err,results){
			cb(err,results);
		});
	}
	//更新订单状态
	var update_order_status = function(order_id,order_status,change,cb){
		server.plugins['models'].orders.update_order_status(order_id,order_status,change,function(err,results){
			cb(err,results);
		});
	};
	//查询订单
	var search_order = function(order_id,cb){
		server.plugins['models'].orders.search_order(order_id,function(err,results){
			cb(err,results);
		});
	};
	//查询订单详细
	var search_order_details = function(order_id,cb){
		server.plugins['models'].order_details.search_order_details(order_id,function(err,results){
			cb(err,results);
		});
	};
	//查询门店
	var search_store = function(org_code,ids,cb){
		var url = "http://139.196.148.40:18001/store/list_by_org_ids?org_code="+org_code+"&ids="+ids;
		do_get_method(url,cb);
	};
	//批量查询商品信息
	var find_products_with_picture = function(product_ids,cb){
		var url = "http://127.0.0.1:7000/find_products_with_picture?product_ids="+product_ids;
		do_get_method(url,cb);
	};
	//得到所有订单信息
	var get_all_orders = function(cb){
		server.plugins['models'].orders.get_all_orders(function(err,results){
			cb(err,results);
		});
	};
	//根据日期得到订单信息
	var get_orders_byDate = function(date1,date2,cb){
		server.plugins['models'].orders.get_orders_byDate(date1,date2,function(err,results){
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
				var vip_id = request.payload.vip_id;
				var pay_way = request.payload.pay_way;
				var store_id = request.payload.store_id;
				var small_change = request.payload.small_change;
				console.log("store_id: "+store_id);
				products = JSON.parse(products);
				if (!actual_price || !marketing_price || !pos_id || !operation_system || !origin || !products || !store_id || !small_change) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				save_order(order_id,vip_id,actual_price,marketing_price,pos_id,operation_system,origin,pay_way,store_id,small_change,function(err, results){
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
		//保存付款方式
		{
			method: 'POST',
			path: '/save_pay_way',
			handler: function(request, reply){
				var order_id = request.payload.order_id;
				var serial_number = request.payload.serial_number;
				var person_id = request.payload.person_id;
				var pay_way = request.payload.pay_way;
				var pay_amount = request.payload.pay_way;
				if (!order_id || !serial_number || !person_id || !pay_way || !pay_amount ) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				save_pay_way(order_id,serial_number,person_id,pay_way,pay_amount,function(err, results){
					if (results.affectedRows>0) {
						return reply({"success":true,"message":"ok","service_info":service_info});
					}else {
						return reply({"success":false,"message":"save pay_way fail","service_info":service_info});
					}
				});
			}
		},
		//更新订单状态
		{
			method: 'POST',
			path: '/update_order_status',
			handler: function(request, reply){
				var order_id = request.payload.order_id;
				var order_status = request.payload.order_status;
				var change = request.payload.change;
				if (!order_id || !order_status || !change) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				update_order_status(order_id,order_status,change,function(err, results){
					if (results.affectedRows>0) {
						return reply({"success":true,"message":"ok","service_info":service_info});
					}else {
						return reply({"success":false,"message":"save pay_way fail","service_info":service_info});
					}
				});
			}
		},
		//查询订单,及订详细
		{
			method: 'GET',
			path: '/search_order',
			handler: function(request, reply){
				var order_id = request.query.order_id;
				if (!order_id) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				var ep = eventproxy.create("order","order_details",
					function(order,order_details){
						return reply({"success":true,"order":order,"order_details":order_details,"service_info":service_info});
				});
				search_order(order_id,function(err, row){
					console.log("order:"+JSON.stringify(row));
					if (!err) {
						if (row.length >0) {
							var order = row[0];
							ep.emit("order", order);
						}else {
							ep.emit("order", null);
						}
					}else {
						return reply({"success":false,"message":"search order fail","service_info":service_info});
					}
				});
				search_order_details(order_id,function(err, rows){
					console.log("order_details:"+JSON.stringify(rows));
					if (!err) {
						if (rows.length >0) {
							var order_details = rows;
							ep.emit("order_details", order_details);
						}else {
							ep.emit("order_details", null);
						}
					}else {
						return reply({"success":false,"message":"search order_details fail","service_info":service_info});
					}
				});
			}
		},
		//查询订单,及订详细,商品信息
		{
			method: 'GET',
			path: '/search_order_products',
			handler: function(request, reply){
				var order_id = request.query.order_id;
				if (!order_id) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				var ep = eventproxy.create("order","order_details","store","products",
					function(order,order_details,store,products){
						return reply({"success":true,"order":order,"order_details":order_details,"store":store,"products":products,"service_info":service_info});
				});
				search_order(order_id,function(err, row){
					if (!err) {
						if (row.length >0) {
							var order = row[0];
							ep.emit("order", order);
							var org_code = "ioio";
							var ids = JSON.stringify([order.store_id]);
							search_store(org_code,ids,function(err,row){
								if (!err) {
									if (row.success) {
										var store = row.rows[0];
										ep.emit("store", store);
									}else {
										ep.emit("store", null);
									}
								}else {
									return reply({"success":false,"message":"search store fail"});
								}
							});
						}else {
							ep.emit("order", null);
						}
					}else {
						return reply({"success":false,"message":"search order fail","service_info":service_info});
					}
				});
				search_order_details(order_id,function(err, rows){
					if (!err) {
						if (rows.length >0) {
							var order_details = rows;
							ep.emit("order_details", order_details);
							var product_ids = [];
							for (var i = 0; i < rows.length; i++) {
								product_ids.push(rows[i].product_id);
							}
							product_ids = JSON.stringify(product_ids);
							find_products_with_picture(product_ids,function(err, rows){
								if (!err) {
									if (rows) {
										var products = rows.products;
										ep.emit("products", products);
									}else {
										ep.emit("products", null);
									}
								}else {

								}
							});
						}else {
							ep.emit("order_details", null);
						}
					}else {
						return reply({"success":false,"message":"search order_details fail","service_info":service_info});
					}
				});
			}
		},
		//得到所有订单
		{
			method: 'GET',
			path: '/get_all_orders',
			handler: function(request, reply){
				get_all_orders(function(err, results){
					if (!err) {
						console.log("results:"+JSON.stringify(results));
						if (results.length > 0) {
							return reply({"success":true,"message":"ok","rows":results,"service_info":service_info});
						}else {

						}
					}else {

					}
				});
			}
		},
		//根据日期得到所有订单
		{
			method: 'GET',
			path: '/get_orders_byDate',
			handler: function(request, reply){
				var date1 = request.query.date1;
				var date2 = request.query.date2;
				console.log("date1:"+date1);
				console.log("date2:"+date2);
				get_orders_byDate(date1,date2,function(err, results){
					if (!err) {
						console.log("results:"+JSON.stringify(results));
						if (results.length > 0) {
							return reply({"success":true,"message":"ok","rows":results,"service_info":service_info});
						}else {
							return reply({"success":true,"message":"ok","rows":null,"service_info":service_info});
						}
					}else {

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
