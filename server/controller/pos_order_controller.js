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
		if (!err && response.statusCode === 200) {
			cb(false,body);
		} else {
			cb(true,null);
		}
	});
};

exports.register = function(server, options, next){
	//pos端
	var save_order = function(order_id,person_id,vip_id,actual_price,marketing_price,pos_id,operation_system,origin,pay_way,store_id,small_change,operation_person,cb){
		server.plugins['models'].orders.save_orders(order_id,person_id,vip_id,actual_price,marketing_price,pos_id,operation_system,origin,pay_way,store_id,small_change,operation_person,function(err,results){
			cb(err,results);
		});
	};
	var save_order_details = function(order_id, products, cb){
		server.plugins['models'].order_details.save_order_details(order_id, products, function(err,results){
			cb(err,results);
		});
	};
	//更新订单状态
	var update_order_status = function(order_id,order_status,changes,ready_pay,cb){
		server.plugins['models'].orders.update_order_status(order_id,order_status,changes,ready_pay,function(err,results){
			cb(err,results);
		});
	};
	//订单支付信息
	var get_order_pay_infos = function(order_id,cb){
		var url = "http://139.196.148.40:18008/get_order_pay_infos?order_id=";
		url = url + order_id + "&sob_id=ioio";
		do_get_method(url,cb);
	}
	//查询订单
	var search_order = function(order_id,cb){
		server.plugins['models'].orders.search_order(order_id,function(err,results){
			cb(err,results);
		});
	};
	//生成pos单号
	var generate_order_no = function(cb){
		var url = "http://211.149.248.241:18011/generate_order_no"
		var data = {
			org_code : "ioio",
			order_type : "pos"
		};
		do_post_method(data,url,cb);
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
		var url = "http://127.0.0.1:18002/find_products_with_picture?product_ids="+product_ids;
		do_get_method(url,cb);
	};
	//
	var get_all_num = function(params,cb){
		server.plugins['models'].orders.get_all_num(params,function(err,results){
			cb(err,results);
		});
	};
	//根据日期得到订单信息
	var get_orders_byDate = function(date1,date2,cb){
		server.plugins['models'].orders.get_orders_byDate(date1,date2,function(err,results){
			cb(err,results);
		});
	};
	//查询会员订单
	var get_member_orders = function(person_id,date1,date2,cb){
		server.plugins['models'].orders.get_member_orders(person_id,date1,date2,function(err,results){
			cb(err,results);
		});
	};

	server.route([
		//pos端

		//充值订单查询
		{
			method: 'GET',
			path: '/get_recharge_order',
			handler: function(request, reply){
				var order_id = request.query.order_id;
				if (!order_id) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				server.plugins['models'].recharge_order.get_order(order_id,function(err,results){
					if (!err) {
						return reply({"success":true,"rows":results,"service_info":service_info});
					}else {
						return reply({"success":false,"message":results.message,"service_info":service_info});
					}
				});
			}
		},

		//更新充值订单状态
		{
			method: 'POST',
			path: '/update_recharge_status',
			handler: function(request, reply){
				var order_id = request.payload.order_id;
				var order_status = request.payload.order_status;
				if (!order_id || !order_status) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				server.plugins['models'].recharge_order.update_order_status(order_id,order_status,function(err,results){
					if (!err) {
						return reply({"success":true,"message":"ok","service_info":service_info});
					}else {
						return reply({"success":false,"message":results.message,"service_info":service_info});
					}
				});
			}
		},

		//单条信息的支付，产品，等详情
		{
			method: 'GET',
			path: '/get_order_details',
			handler: function(request, reply){
				var order_id = request.query.order_id;
				if (!order_id) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				var ep = eventproxy.create("order_details","products","pay_infos",
					function(order_details,products,pay_infos){
						return reply({"success":true,"order_details":order_details,"pay_infos":pay_infos,"products":products,"service_info":service_info});
				});
				get_order_pay_infos(order_id, function(err,row){
					if (!err) {
						if (row.success) {
							var pay_infos = row.rows;
							ep.emit("pay_infos", pay_infos);
						}else {
							ep.emit("pay_infos", null);
						}
					}else {
						ep.emit("pay_infos", null);
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
									ep.emit("products", null);
								}
							});
						}else {
							ep.emit("order_details", null);
							ep.emit("products", null);
						}
					}else {
						ep.emit("order_details", null);
						ep.emit("products", null);
					}
				});

			}
		},
		//查询订单,及订详细,商品信息
		{
			method: 'GET',
			path: '/search_order_info',
			handler: function(request, reply){
				var order_id = request.query.order_id;
				if (!order_id) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				search_order(order_id,function(err, row){
					if (!err) {
						if (row.length >0) {
							var order = row[0];
							var org_code = "ioio";
							var ids = JSON.stringify([order.store_id]);
							search_store(org_code,ids,function(err,row){
								if (!err) {
									if (row.success) {
										var store = row.rows[0];
										order.store = store;
											return reply({"success":true,"message":"ok","order":order,"service_info":service_info});
									}else {
										return reply({"success":false,"message":row.message,"service_info":service_info});
									}
								}else {
									return reply({"success":false,"message":row.message,"service_info":service_info});
								}
							});
						}else {
							return reply({"success":true,"message":"search order null","service_info":service_info});
						}
					}else {
						return reply({"success":false,"message":row.message,"service_info":service_info});
					}
				});
			}
		},
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
				var products = request.payload.products;
				var vip_id = request.payload.vip_id;
				var pay_way = request.payload.pay_way;
				var store_id = request.payload.store_id;
				var small_change = request.payload.small_change;
				var person_id = request.payload.person_id;
				var operation_person = request.payload.operation_person;
				products = JSON.parse(products);
				var order_id;
				if (!actual_price || !marketing_price || !pos_id || !operation_system || !origin || !products || !store_id || !small_change || !operation_person) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				generate_order_no(function(err,row){
					if (!err) {
						if (row.success) {
							order_id = row.order_no;
							save_order(order_id,person_id,vip_id,actual_price,marketing_price,pos_id,operation_system,origin,pay_way,store_id,small_change,operation_person,function(err, results){
								if (results.affectedRows>0) {
									for (var i = 0; i < products.length; i++) {
										var product = products[i];
										product.order_index = i+1;
										product.total_price = product.discount_product_price * product.product_number;
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
						}else {
							return reply({"success":false,"message":"params wrong","service_info":service_info});
						}
					}else {
						return reply({"success":false,"message":"params wrong","service_info":service_info});
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
				var changes = request.payload.changes;
				var ready_pay = request.payload.ready_pay;
				if (!order_id || !order_status || !changes || !ready_pay) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				update_order_status(order_id,order_status,changes,ready_pay,function(err, results){
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
									ep.emit("store", null);
								}
							});
						}else {
							ep.emit("order", null);
							ep.emit("store", null);
						}
					}else {
						return reply({"success":true,"message":"search order fail","service_info":service_info});
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
									ep.emit("products", null);
								}
							});
						}else {
							ep.emit("order_details", null);
							ep.emit("products", null);
						}
					}else {
						return reply({"success":false,"message":"search order_details fail","service_info":service_info});
					}
				});
			}
		},
		//查询订单信息详情，支付方式
		{
			method: 'GET',
			path: '/search_order_infos',
			handler: function(request, reply){
				var order_id = request.query.order_id;
				if (!order_id) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				var ep = eventproxy.create("order","order_details","store","products","pay_infos",
					function(order,order_details,store,products,pay_infos){
						if (!order) {
							return reply({"success":false,"message":"order is null","service_info":service_info});
						}
						order.store = store;
						var total_number = 0;
						for (var i = 0; i < order_details.length; i++) {
							total_number = total_number + order_details[i].number;
							for (var j = 0; j < products.length; j++) {
								if (order_details[i].product_id == products[j].id) {
									order_details[i].product = products[j];
								}
							}
						}
						order.total_number = total_number;
						order.order_details = order_details;
						order.pay_infos = pay_infos;
						return reply({"success":true,"row":order,"service_info":service_info});
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
										if (row.rows.length>0) {
											var store = row.rows[0];
											ep.emit("store", store);
										}else {
											ep.emit("store", null);
										}

									}else {
										ep.emit("store", null);
									}
								}else {
									ep.emit("store", null);
								}
							});
						}else {
							ep.emit("order", null);
							ep.emit("store", null);
						}
					}else {
						return reply({"success":true,"message":"search order fail","service_info":service_info});
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
									ep.emit("products", null);
								}
							});
						}else {
							ep.emit("order_details", null);
							ep.emit("products", null);
						}
					}else {
						return reply({"success":false,"message":"search order_details fail","service_info":service_info});
					}
				});

				get_order_pay_infos(order_id, function(err,row){
					if (!err) {
						if (row.success) {
							var pay_infos = row.rows;
							ep.emit("pay_infos", pay_infos);
						}else {
							ep.emit("pay_infos", null);
						}
					}else {
						ep.emit("pay_infos", null);
					}
				});
			}
		},
        
        //得到所有订单
		{
			method: 'GET',
			path: '/get_all_orders',
			handler: function(request, reply){
				var params = request.query.params;
				if (!params) {
					return reply({"success":false,"message":"params null","service_info":service_info});
				}
				params = JSON.parse(params);
                server.plugins['models'].orders.get_all_orders(params,function(err,results){
                    if (!err) {
						if (results.length > 0) {
							return reply({"success":true,"message":"ok","rows":results,"service_info":service_info});
						}else {
							return reply({"success":false,"message":results.messsage,"service_info":service_info});
						}
					}else {
						return reply({"success":false,"message":results.messsage,"service_info":service_info});
					}
                });
			}
		},
		//查询所有数量
		{
			method: 'GET',
			path: '/get_all_num',
			handler: function(request, reply){
				var params = request.query.params;
				if (!params) {
					return reply({"success":false,"message":"params null","service_info":service_info});
				}
				params = JSON.parse(params);
				// if (!params) {
				// 	return reply({"success":false,"message":"params null","service_info":service_info});
				// }
				// params = JSON.parse(params);
				get_all_num(params,function(err, results){
					if (!err) {
						if (results.length > 0) {
							return reply({"success":true,"message":"ok","num":results[0].num,"service_info":service_info});
						}else {
							return reply({"success":false,"message":results.messsage,"service_info":service_info});
						}
					}else {
						return reply({"success":false,"message":results.messsage,"service_info":service_info});
					}
				});
			}
		},



		//根据日期得到所有订单
		{
			method: 'GET',
			path: '/get_front_orders',
			handler: function(request, reply){
				var person_id = request.query.person_id;
				if (!person_id) {
					return reply({"success":false,"message":"params null","service_info":service_info});
				}
				server.plugins['models'].orders.get_front_orders(person_id,function(err,rows){
					if (!err) {
						return reply({"success":true,"message":"ok","rows":rows,"service_info":service_info});
					}else {
						return reply({"success":false,"message":"error","service_info":service_info});
					}
				});
			}
		},
		//查询所有订单
		{
			method: 'GET',
			path: '/get_orders_byDate',
			handler: function(request, reply){
				var date1 = request.query.date1;
				var date2 = request.query.date2;
				if (!date1 || !date2) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				get_orders_byDate(date1,date2,function(err, results){
					if (!err) {
						if (results.length == 0) {
							return reply({"success":true,"prducts_num":0,"rows":[],"service_info":service_info});
						}
						var order_ids = [];
						for (var i = 0; i < results.length; i++) {
							order_ids.push(results[i].order_id);
						}
						server.plugins['models'].order_details.search_orders_details(order_ids,function(err,rows){
							if (!err) {
								var prducts_num = 0;
								for (var i = 0; i < rows.length; i++) {
									prducts_num = prducts_num + rows[i].number;
								}
								return reply({"success":true,"prducts_num":prducts_num,"rows":results,"service_info":service_info});
							}else {
								return reply({"success":false,"message":rows.message,"service_info":service_info});
							}
						});
					}else {
						return reply({"success":false,"message":results.message,"service_info":service_info});
					}
				});
			}
		},
		//查询会员订单，开始时间-结束时间
		{
			method: 'GET',
			path: '/search_member_orders',
			handler: function(request, reply){
				var person_id = request.query.person_id;
				var date1 = request.query.date1;
				var date2 = request.query.date2;
				if (!person_id || !date1 || !date2) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				get_member_orders(person_id,date1,date2,function(err, results){
					if (!err) {
						if (results.length > 0) {
							for (var i = 0; i < results.length; i++) {
								var order_id = results[i].order_id;

							}
							return reply({"success":true,"message":"ok","rows":results,"service_info":service_info});
						}else {
							return reply({"success":true,"message":"ok","rows":null,"service_info":service_info});
						}
					}else {
						return reply({"success":false,"message":"search fail","service_info":service_info});
					}
				});
			}
		},
		//根据订单号查订单信息





	]);

    next();
};

exports.register.attributes = {
    name: 'pos_order_controller'
};
