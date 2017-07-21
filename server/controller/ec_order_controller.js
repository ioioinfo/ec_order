// Base routes for item..
const uu_request = require('../utils/uu_request');
const uuidV1 = require('uuid/v1');
var async = require('async');
var eventproxy = require('eventproxy');
var service_info = "ec order service";
var order_status = {
	"-1": "等待买家付款",
	"0" : "付款确认中",
	"1" : "等待卖家拣货",
	"2" : "等待卖家发货",
	"3" : "等待快递员揽货",
	"4" : "卖家已发货",
	"5" : "等待买家收货",
	"6" : "交易成功",
	"7" : "交易关闭",
	"8" : "订单取消审核中",
	"9" : "订单退款中",
	"10" : "退款成功",
	"11" : "退款失败",
	"12" : "等待买家评价"
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
	//物流运费
	var logistics_payment = function(data,cb){
		var url = "http://211.149.248.241:18013/freightage/compute";
		do_post_method(url,data,cb);
	};
	//查询ec所有订单
	var get_ec_orders = function(person_id,cb){
		server.plugins['models'].ec_orders.get_ec_orders(person_id,function(err,results){
			cb(err,results);
		});
	};
	//查询ec  单条order信息
	var get_ec_order = function(order_id,cb){
		server.plugins['models'].ec_orders.get_ec_order(order_id,function(err,results){
			cb(err,results);
		});
	};
	//查询ec所有明细
	var get_ec_all_details = function(order_ids,cb){
		server.plugins['models'].ec_orders_details.search_ec_order_details(order_ids,function(err,results){
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
	var search_logistics_info = function(order_id,cb){
		var url = "http://211.149.248.241:18013/logistics/get_latest_by_order?order_id="+order_id;
		do_get_method(url,cb);
	};
	//查询物流信息全
	var search_logistics_infos = function(order_id,cb){
		var url = "http://211.149.248.241:18013/logistics/list_by_order?order_id="+order_id;
		do_get_method(url,cb);
	};
	//更新订单状态
	var update_order_status = function(order_id,order_status,cb){
		server.plugins['models'].ec_orders.update_order_status(order_id,order_status,function(err,results){
			cb(err,results);
		});
	};
	//解库
	var unlock_stock = function(data,cb){
		var url = "http://211.149.248.241:12001/batch_unlock_stock";
		do_post_method(url,data,cb);
	}
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
	//选中购物车信息
	var search_selected_carts = function(person_id,ids,cb){
		var url = "http://127.0.0.1:18015/search_selected_carts?person_id=";
		url = url + person_id + "&ids=" + ids;
		do_get_method(url,cb);
	};
	//生成pos单号
	var generate_order_no = function(order_type,cb){
		var url = "http://211.149.248.241:18011/generate_order_no"
		var data = {
			org_code : "ioio",
			order_type : order_type
		};
		do_post_method(url,data,cb);
	};
	//发货时间
	var delivery_time_by_order = function(order_id,cb){
		var url = "http://211.149.248.241:18013/logistics/delivery_time_by_order?org_code=ioio&order_id="+order_id;
		do_get_method(url,cb);
	}
	//订单信息
	var get_order_pay_infos = function(order_id,cb){
		var url = "http://139.196.148.40:18008/get_order_pay_infos?sob_id=ioio&order_id="+order_id;
		do_get_method(url,cb);
	};
	//删除购物车
	var delete_shopping_carts = function(ids,cb){
		var url = "http://127.0.0.1:18015/delete_shopping_carts?ids=";
		url = url + ids;
		do_get_method(url,cb);
	};
	//批量查询商品信息
	var get_productById = function(product_id,cb){
		var url = "http://127.0.0.1:18002/product_info?product_id="+product_id;
		do_get_method(url,cb);
	};
	//查询ec所有订单
	var get_orders_list = function(cb){
		server.plugins['models'].ec_orders.get_orders_list(function(err,results){
			cb(err,results);
		});
	};
	//解库加出库
	var batch_unlock_and_outbound = function(data,cb){
		var url = "http://211.149.248.241:12001/batch_unlock_and_outbound";
		do_post_method(url,data,cb);
	};
	server.route([
		//发货更新状态减少库存
		{
			method: 'POST',
			path: '/update_order_status_delivery',
			handler: function(request, reply){
				var order_id = request.payload.order_id;
				var order_status = 4;
				if (!order_id) {
					return reply({"success":false,"message":"params null","service_info":service_info});
				}
				var order_ids = [];
				order_ids.push(order_id);
				get_ec_all_details(order_ids,function(error,content){
					if (!error) {
						var products = [];
						for (var i = 0; i < content.length; i++) {
							var order_detail = content[i];
							var product = {
								"product_id": order_detail.product_id,
								"quantity": order_detail.number
							};
							products.push(product);
						}
						products = JSON.stringify(products);
						var data = {
							"platform_code":"ioio",
							"batch_id":order_id,
							"products":products
						};
						batch_unlock_and_outbound(data,function(err,content){
							if (!err) {
								server.plugins['models'].ec_orders.update_order_status(order_id,order_status,function(err,results){
									if (!err) {
										return reply({"success":true,"message":"ok","service_info":service_info});
									}else {
										return reply({"success":false,"message":results.message,"service_info":service_info});
									}
								});
							}else {
								return reply({"success":false,"message":content.message,"service_info":content.service_info});
							}
						});
					}else {
						return reply({"success":false,"message":content.message,"service_info":service_info});
					}
				});
			}
		},
		//批量查明细
		{
			method: 'GET',
			path: '/search_orders_infos',
			handler: function(request, reply){
				var order_ids = request.query.order_ids;
				order_ids = JSON.parse(order_ids);
				server.plugins['models'].ec_orders.search_orders(order_ids,function(err,results){
					if (!err) {
						if (results.length===0) {
							return reply({"success":false,"message":"没有订单","service_info":service_info});
						}
						get_ec_all_details(order_ids,function(error,content){
							if (!error) {
								for (var i = 0; i < results.length; i++) {
									var details = [];
									for (var j = 0; j < content.length; j++) {
										if (results[i].order_id == content[j].order_id) {
											var order = {};
											order.order_id = results[i].order_id;
											order.pay_date = "";
											order.send_date = "";
											order.logistics_company = "";
											order.product_id = content[j].product_id;
											order.products_industries = "";
											order.number = content[j].number;
											order.marketing_price = content[j].marketing_price;
											order.price = content[j].price;
											order.child_status = "";
											order.return_status = "";
											order.total_price = content[j].total_price;
											order.person_nickname = "";
											order.tele_phone = "";
											details.push(order);
										}

										results[i].details = details;
									}
								}
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
								product_ids = JSON.stringify(product_ids);
								find_products_with_picture(product_ids,function(err, rows){
									if (!err) {
										var products = rows.products;
										var products_map = {};
										for (var i = 0; i < products.length; i++) {
											var product = products[i];
											products_map[product.id] = product;
										}
										return reply({"success":true,"message":"ok","rows":results,"products":products_map,"service_info":service_info});
									}else {
										return reply({"success":false,"message":rows.message,"service_info":service_info});
									}
								});
							}else {
								return reply({"success":false,"message":content.message,"service_info":service_info});
							}
						});
					}else {
						return reply({"success":false,"message":row.message,"service_info":service_info});
					}
				});
			}
		},
		//导入出订单
		{
			method: 'GET',
			path: '/export_ec_order',
			handler: function(request, reply){
				get_orders_list(function(err,results){
					if (!err) {
						if (results.length===0) {
							return reply({"success":false,"message":"没有订单","service_info":service_info});
						}
						var order_ids = [];
						for (var i = 0; i < results.length; i++) {
							order_ids.push(results[i].order_id);
						}
						get_ec_all_details(order_ids,function(error,content){
							if (!error) {
								var orders = [];
								for (var i = 0; i < results.length; i++) {
									for (var j = 0; j < content.length; j++) {
										if (results[i].order_id == content[j].order_id) {
											var order = {};
											order.order_id = results[i].order_id;
											order.place_order = results[i].created_at_text;
											order.pay_date = "";
											order.send_date = "";
											order.close_order = results[i].updated_at_text;
											order.logistics_company = "";
											order.logistics_id = results[i].logistic_id;
											order.product_id = content[j].product_id;
											order.products_industries = "";
											order.number = content[j].number;
											order.marketing_price = content[j].marketing_price;
											order.price = content[j].price;
											order.child_status = "";
											order.return_status = "";
											order.total_price = content[j].total_price;
											order.logistics_price = results[i].logistics_price;
											order.order_status = results[i].order_status;
											order.person_nickname = "";
											order.receive_person = results[i].linkname;
											order.mobile = results[i].mobile;
											order.tele_phone = "";
											order.detail_address = results[i].detail_address;
											orders.push(order);
										}
									}
								}
								reply({"success":true,"orders":orders,"service_info":service_info});
							}else {
								return reply({"success":false,"message":content.message,"service_info":service_info});
							}
						});
					}else {
						return reply({"success":false,"message":row.message,"service_info":service_info});
					}
				});
			}
		},
		//删除订单
		{
			method: 'POST',
			path: '/order_delete',
			handler: function(request, reply){
				var order_id = request.payload.order_id;
				server.plugins['models'].ec_orders.order_delete(order_id,function(err,row){
					if (row.affectedRows>0) {
						return reply({"success":true,"message":"ok","service_info":service_info});
					}else {
						return reply({"success":false,"message":row.message,"service_info":service_info});
					}
				});
			}
		},
		//查询订单
		{
			method: 'GET',
			path: '/search_order_byStatus',
			handler: function(request, reply){
				var status = request.query.status;
				var person_id = request.query.person_id;
				if (!status || !person_id) {
					return reply({"success":false,"message":"params null","service_info":service_info});
				}
				status = JSON.parse(status);
				server.plugins['models'].ec_orders.search_order_byStatus(person_id,status,function(err,results){
					if (!err) {
						if (!results || results.length == 0) {
							return reply({"success":true,"message":"ok","orders":results,"details":{},"products":{},"service_info":service_info});
						}
						var order_ids = [];
						for (var i = 0; i < results.length; i++) {
							order_ids.push(results[i].order_id);
							results[i].order_status = order_status[results[i].order_status];
						}
						get_ec_all_details(order_ids,function(error,content){
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
								product_ids = JSON.stringify(product_ids);
								find_products_with_picture(product_ids,function(err, rows){
									if (!err) {
										var products = rows.products;
										var products_map = {};
										for (var i = 0; i < products.length; i++) {
											var product = products[i];
											products_map[product.id] = product;
										}
										return reply({"success":true,"message":"ok","orders":results,"details":order_map,"products":products_map,"service_info":service_info});
									}else {
										return reply({"success":false,"message":rows.message,"service_info":service_info});
									}
								});
							}else {
								return reply({"success":false,"message":content.message,"service_info":service_info});
							}
						});
					}else {
						return reply({"success":false,"message":results.message,"service_info":service_info});
					}
				});
			}
		},
		//取消订单
		{
			method: 'POST',
			path: '/order_cancel',
			handler: function(request, reply){
				var order_id = request.payload.order_id;
				var reason = request.payload.reason;
				var order_status = request.payload.status;
				if (!order_id||!order_status||!reason) {
					return reply({"success":false,"message":"params null","service_info":service_info});
				}
				server.plugins['models'].ec_orders.order_cancel(order_id,reason,order_status,function(err,row){
					if (row.affectedRows>0) {
						return reply({"success":true,"service_info":service_info});
					}else {
						return reply({"success":false,"message":row.message,"service_info":service_info});
					}
				});
			}
		},
		//取消订单
		{
			method: 'POST',
			path: '/order_cancel_operation',
			handler: function(request, reply){
				var order_id = request.payload.order_id;
				if (!order_id) {
					return reply({"success":false,"message":"order_id null","service_info":service_info});
				}
				var reason = "超时自动关闭";
				var order_status = 7;
				if (request.payload.reason) {
					reason = request.payload.reason;
				}
				if (request.payload.order_status) {
					reason = request.payload.order_status;
				}
				server.plugins['models'].ec_orders.get_order(order_id,function(err,result){
					if (!err) {
						if (result.length >0) {
							if (result[0].order_status == "0" || result[0].order_status == "-1") {
								server.plugins['models'].ec_orders.order_cancel(order_id,reason,order_status,function(err,row){
									if (row.affectedRows>0) {
										var order_ids = [];
										order_ids.push(order_id);
										get_ec_all_details(order_ids,function(error,content){
											if (!error) {
												var products = [];
												for (var i = 0; i < content.length; i++) {
													var order_detail = content[i];
													var product = {};
													product.product_id = order_detail.product_id;
													product.quantity = order_detail.number;
													products.push(product);
												}
												var info = {"batch_id":order_id,"products":JSON.stringify(products),"platform_code":"ioio"};
												unlock_stock(info,function(err,content){
													if (!err) {
														return reply({"success":true});
													}else {
														return reply({"success":false,"message":content.message});
													}
												});
											}else {
												return reply({"success":false,"message":content.message,"service_info":service_info});
											}
										});

									}else {
										return reply({"success":false,"message":row.message,"service_info":service_info});
									}
								});
							}else {
								return reply({"success":false,"message":"订单装状态不符","service_info":service_info});
							}
						}else {
							return reply({"success":false,"message":"没有找到订单","service_info":service_info});
						}
					}else {
						return reply({"success":false,"message":results.message,"service_info":service_info});
					}
				});
			}
		},
		//保存事件
		{
			method: 'POST',
			path: '/save_event',
			handler: function(request, reply){
				var id = request.payload.id;
				var is_deal = request.payload.is_deal;
				server.plugins['models'].event_solution.save_event(id,is_deal,function(err,row){
					if (row.affectedRows>0) {
						return reply({"success":true,"message":"ok","service_info":service_info});
					}else {
						return reply({"success":false,"message":row.message,"service_info":service_info});
					}
				});
			}
		},
		//查询事件是否处理
		{
			method: 'POST',
			path: '/search_deal_event',
			handler: function(request, reply){
				var id = request.payload.id;
				server.plugins['models'].event_solution.search_deal_event(id,function(err,row){
					if (!err) {
						return reply({"success":true,"row":row,"service_info":service_info});
					}else {
						return reply({"success":false,"message":row.message,"service_info":service_info});
					}
				});
			}
		},
		//更新订单状态
		{
			method: 'POST',
			path: '/update_order_status_pay',
			handler: function(request, reply){
				var order_id = request.payload.order_id;
				var order_status = request.payload.order_status;
				if (!order_id ||!order_status) {
					return reply({"success":false,"message":"params null","service_info":service_info});
				}
				server.plugins['models'].ec_orders.update_order_status(order_id,order_status,function(err,results){
					if (!err) {
						return reply({"success":true,"message":"ok","service_info":service_info});
					}else {
						return reply({"success":false,"message":results.message,"service_info":service_info});
					}
				});
			}
		},

		//保存充值订单
		{
			method: 'POST',
			path: '/save_recharge_order',
			handler: function(request, reply){
				var marketing_price = request.payload.marketing_price;
				var actual_price = request.payload.actual_price;
				var activity_id = request.payload.activity_id;
				var person_id = request.payload.person_id;
				var pay_way = request.payload.pay_way;
				if (!person_id||!pay_way||!activity_id||!actual_price||!marketing_price) {
					return reply({"success":false,"message":"params null","service_info":service_info});
				}
				generate_order_no("recharge_order",function(err,row){
					if (!err) {
						var order_id = row.order_no;
						server.plugins['models'].recharge_order.save_order(order_id,activity_id,person_id,marketing_price,actual_price,pay_way,function(err,results){
							if (!err) {
								return reply({"success":true,"message":"ok","orders":results,"order_id":order_id,"service_info":service_info});
							}else {
								return reply({"success":false,"message":results.message,"service_info":service_info});
							}
						});
					}else {
						return reply({"success":false,"message":row.message,"service_info":service_info});
					}
				});

			}
		},

		//保存立即购买订单
		{
			method: 'POST',
			path: '/save_fast_order_infos',
			handler: function(request, reply){
				var person_id = request.payload.person_id;
				var send_seller = request.payload.send_seller;
				var address = request.payload.address;
				var number = request.payload.num;
				var product_id = request.payload.product_id;
				var sku_id = request.payload.sku_id;
				var id = request.payload.id;
				if (!person_id || !number || !product_id || !sku_id || !id) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				get_productById(product_id,function(err,content){
					if (!err) {
						var product = content.row;
						var origin = "ec_mp";
						var products_price = product.product_sale_price*parseInt(number);
						var gain_point = products_price;
						var total_number = number;
						var weight = (product.weight * parseInt(number)).toFixed(2);
						var order_status = -1;
						var info = {
							"type" : JSON.parse(address).type,
							"store_id" : JSON.parse(address).store_id,
							"point_id" : JSON.parse(address).point_id,
							"weight" : weight,
							"order_amount" : total_number,
							"end_province" :JSON.parse(address).province,
							"end_city" : JSON.parse(address).city,
							"end_district" : JSON.parse(address).district
						};
						logistics_payment(info,function(err,result){
							if (!err) {
								var lgtic_pay = result.row.user_amount;
								if (!lgtic_pay && lgtic_pay!=0) {
									lgtic_pay = 150;
								}else {
									var amount = lgtic_pay;
								}
								var actual_price = gain_point + amount;
								generate_order_no("ec_order",function(err,row){
									if (!err) {
										order_id = row.order_no;
										server.plugins['models'].ec_orders.save_order_infos(id,order_id,person_id,gain_point,products_price,total_number,weight,order_status,origin,amount,actual_price,send_seller,address,function(err,results){
											if (!err){
												var product_id = product.id;
												var order_index = 1;
												var price = product.product_sale_price;
												var marketing_price = product.product_marketing_price;
												var total_price = price * number;
												server.plugins['models'].ec_orders_details.save_ec_order_details(order_id,product_id,order_index,number,price,marketing_price,total_price,sku_id,function(err,results){
													if (!err){
														return reply({"success":true,"message":"ok","service_info":service_info,"order_id":order_id});
													}else {
														return reply({"success":false,"message":results.message,"service_info":service_info});
													}
												});
											}else {
												return reply({"success":false,"message":results.message,"service_info":service_info});
											}
										});
									}else {
										return reply({"success":false,"message":row.message,"service_info":service_info});
									}
								});
							}else {
								return reply({"success":false,"message":result.message,"service_info":service_info});
							}
						});
					}else {
						return reply({"success":false,"message":content.message,"service_info":service_info});
					}
				});
			}
		},
		// 订单明细
		{
			method: 'GET',
			path: '/get_mp_order_details',
			handler: function(request, reply){
				var order_id = request.query.order_id;
				if (!order_id) {
					return reply({"success":false,"message":"params null","service_info":service_info});
				}
				var order_ids = [];
				order_ids.push(order_id);
				get_ec_all_details(order_ids,function(error,content){
					if (!error) {
						var product_ids = [];
						for (var i = 0; i < content.length; i++) {
							var order_detail = content[i];
							product_ids.push(order_detail.product_id);
						}
						product_ids = JSON.stringify(product_ids);
						find_products_with_picture(product_ids,function(errs, rows){
							if (!errs) {
								var products = rows.products;
								var products_map = {};
								for (var i = 0; i < products.length; i++) {
									var product = products[i];
									products_map[product.id] = product;
								}
								return reply({"success":true,"message":"ok","details":content,"products":products_map,"service_info":service_info});
							}else {
								return reply({"success":false,"message":rows.message,"service_info":service_info});
							}
						});
					}else {
						return reply({"success":false,"message":content.message,"service_info":service_info});
					}
				});
			}
		},

		//按订单号查询
		{
			method: 'GET',
			path: '/get_order',
			handler: function(request, reply){
				var order_id = request.query.order_id;
				if (!order_id) {
					return reply({"success":false,"message":"params null","service_info":service_info});
				}
				server.plugins['models'].ec_orders.get_order(order_id,function(err,result){
					if (!err) {
						if (result.length >0) {
							return reply({"success":true,"message":"ok","rows":result,"service_info":service_info});
						}else {
							return reply({"success":false,"message":"没有找到订单","service_info":service_info});
						}
					}else {
						return reply({"success":false,"message":results.message,"service_info":service_info});
					}
				});
			}
		},
		//订单列表
		{
			method: 'GET',
			path: '/mp_orders_list',
			handler: function(request, reply){
				var params = request.query.params;
				if (!params) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				params = JSON.parse(params);
				server.plugins['models'].ec_orders.mp_orders_list(params,function(err,results){
					if (!err) {
						var orders = results;
						if (orders.length>0) {
							server.plugins['models'].ec_orders.mp_orders_count(params,function(err,results){
								if (!err) {
									var num = results[0].num;
									return reply({"success":true,"message":"ok","rows":orders,"num":num,"service_info":service_info});
								}else {
									return reply({"success":false,"message":results.message,"service_info":service_info});
								}
							});
						}else {
							reply({"success":true,"message":"ok","orders":orders,"num":0,"service_info":service_info});
						}
					}else {
						return reply({"success":false,"message":results.message,"service_info":service_info});
					}
				});
			}
		},
		//得到所有订单
		{
			method: 'GET',
			path: '/get_ec_orders',
			handler: function(request, reply){
				var person_id = request.query.person_id;
				if (!person_id) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				get_ec_orders(person_id,function(err, results){
					if (!err) {
						if (!results || results.length == 0) {
							return reply({"success":true,"message":"ok","orders":results,"details":{},"products":{},"service_info":service_info});
						}
						var order_ids = [];
						for (var i = 0; i < results.length; i++) {
							order_ids.push(results[i].order_id);
							results[i].order_status = order_status[results[i].order_status];
						}
						get_ec_all_details(order_ids,function(error,content){
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
								product_ids = JSON.stringify(product_ids);
								find_products_with_picture(product_ids,function(err, rows){
									if (!err) {
										var products = rows.products;
										var products_map = {};
										for (var i = 0; i < products.length; i++) {
											var product = products[i];
											products_map[product.id] = product;
										}
										return reply({"success":true,"message":"ok","orders":results,"details":order_map,"products":products_map,"service_info":service_info});
									}else {
										return reply({"success":false,"message":rows.message,"service_info":service_info});
									}
								});
							}else {
								return reply({"success":false,"message":content.message,"service_info":service_info});
							}
						});
					}else {
						return reply({"success":false,"message":results.message,"service_info":service_info});
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
						if (results.length ==0) {
							return reply({"success":false,"message":"no data for this order_ids","service_info":service_info});
						}
						for (var i = 0; i < results.length; i++) {
							order_ids.push(results[i].order_id);
							results[i].order_status = order_status[results[i].order_status];
						}
						get_ec_all_details(order_ids,function(error,content){
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
								product_ids = JSON.stringify(product_ids);
								find_products_with_picture(product_ids,function(errs, rows){
									if (!errs) {
										var products = rows.products;
										var products_map = {};
										for (var i = 0; i < products.length; i++) {
											var product = products[i];
											products_map[product.id] = product;
										}
										get_order_pay_infos(order_id,function(err,rows){
											if (!err) {
												var pay_info = rows.rows;
												delivery_time_by_order(order_id,function(err,row){
													if (!err) {
														var delivery_time = row.delivery_time;
														return reply({"success":true,"message":"ok","orders":results,"details":order_map,"products":products_map,"service_info":service_info,"pay_info":pay_info,"delivery_time":delivery_time});
													}else {
														var delivery_time = "未发货";
														return reply({"success":true,"message":"ok","orders":results,"details":order_map,"products":products_map,"service_info":service_info,"pay_info":pay_info,"delivery_time":delivery_time});
													}
												});
											}else {
												return reply({"success":false,"message":rows.message,"service_info":service_info});
											}
										});
									}else {
										return reply({"success":false,"message":rows.message,"service_info":service_info});
									}
								});
							}else {
								return reply({"success":false,"message":content.message,"service_info":service_info});
							}
						});
					}else {
						return reply({"success":false,"message":results.message,"service_info":service_info});
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
						return reply({"success":false,"message":result.message,"service_info":service_info});
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
				search_logistics_info(order_id,function(err,results){
					if (!err) {
						return reply({"success":true,"row":results.row,"service_info":service_info});
					}else {
						return reply({"success":false,"message":results.message,"service_info":service_info});
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
				search_logistics_infos(order_id,function(err,results){
					if (!err) {
						return reply({"success":true,"rows":results.rows,"service_info":service_info});
					}else {
						return reply({"success":false,"message":results.message,"service_info":service_info});
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
				var order_status = 6;
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
					if (!err) {
						return reply({"success":true,"rows":result,"service_info":service_info});
					}else {
						return reply({"success":false,"message":result.message,"service_info":service_info});
					}
				});
			}
		},
		//保存订单表
		{
			method: 'POST',
			path: '/save_order_infos2',
			handler: function(request, reply){
				var person_id = request.payload.person_id;
				var total_data = request.payload.total_data;
				var shopping_carts = request.payload.shopping_carts;
				var send_seller = request.payload.send_seller;
				var address = request.payload.address;
				var logistics_total = request.payload.logistics_total;
				if (!person_id || !total_data || !shopping_carts) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				shopping_carts = JSON.parse(shopping_carts);
				total_data = JSON.parse(total_data);
				logistics_total = JSON.parse(logistics_total);
				var ids = [];
				for (var i = 0; i < shopping_carts.length; i++) {
					ids.push(shopping_carts[i].id);
				}
				ids = JSON.stringify(ids);
				//根据页面的购物车对象中的id查询数据库的购物车和产品信息
				var data_base_carts;
				var data_base_total_data;
				var data_base_products;
				search_selected_carts(person_id,ids,function(err,results){
					if (!err) {
						data_base_carts = results.shopping_carts;
						data_base_products = results.products;
						data_base_total_data = results.total_data;
						//是否存在选择商品
						if (data_base_carts.length==0) {
							return reply({"success":false,"message":"没有选择商品在购物车里"});
						}
						//和页面传的购物车里信息核实
						for (var i = 0; i < shopping_carts.length; i++) {
							var per_price = shopping_carts[i].per_price;
							//商品单价对比
							if (shopping_carts[i].product_id == data_base_products[shopping_carts[i].product_id].id) {
								if (per_price != data_base_products[shopping_carts[i].product_id].product_sale_price) {
									return reply({"success":false,"message":"商品价格有问题！"});
								}
							}
						}
						//商品总数，总价对比
						if (total_data.acount.prices_all != data_base_total_data.total_prices ) {
							return reply({"success":false,"message":"商品总价有问题！"});
						}
						if (total_data.acount.items_all != data_base_total_data.total_items) {
							return reply({"success":false,"message":"商品总数量有问题！"});
						}
						//details data
						var products = data_base_products;
						var address = request.payload.address;
						var save_fail = [];
						var save_success = [];
						async.eachLimit(total_data.mendian,1, function(mendian, cb) {

							var gain_point = total_data.total_prices[mendian];
							var products_price = total_data.total_prices[mendian];
							var total_number = total_data.total_items[mendian];
							var weight = total_data.total_weight[mendian];
							var type = logistics_total[mendian];
							if (!weight) {
								weight = 0;
							}
							var logistics_price = total_data.lgtic_pay[mendian];
							if (!logistics_price) {
								logistics_price = 0;
							}
							var actual_price = logistics_price + products_price;
							console.log("total_data:"+JSON.stringify(total_data));
							var origin = "ec_mp";
							var store_name = mendian;

							generate_order_no("ec_order",function(err,row){
								if (!err) {
									var id = uuidV1();
									var order_id = row.order_no;
									save_success.push(order_id);
									var order_status = -1;
									server.plugins['models'].ec_orders.save_order_infos2(id,order_id,person_id,gain_point,products_price,total_number,weight,order_status,origin,logistics_price,actual_price,send_seller,address,store_name,type,function(err,results){
										if (!err){
											for (var i = 0; i < shopping_carts.length; i++) {
												var product_id = shopping_carts[i].product_id;
												var order_index = i+1;
												var number = shopping_carts[i].total_items;
												var price = products[shopping_carts[i].product_id].product_sale_price;
												var marketing_price = products[shopping_carts[i].product_id].product_marketing_price;
												var total_price = price * number;
												var sku_id = shopping_carts[i].sku_id;
												server.plugins['models'].ec_orders_details.save_ec_order_details(order_id,product_id,order_index,number,price,marketing_price,total_price,sku_id,function(err,results){
													if (!err){

													}else {
														console.log(results.message);
														save_fail.push(mendian);
													}
												});
											}
											cb();
										}else {
											console.log(results.message);
											save_fail.push(mendian);
											cb();
										}
									});
								}else {
									console.log(row.message);
									save_fail.push(mendian);
									cb();
								}
							});

						}, function(err) {
							if (err) {
								console.error("err: " + err);
							}
							return reply({"success":true,"success_num":save_success.length,"ids":save_success,"fail_num":save_fail.length,"service_info":service_info});
						});

						delete_shopping_carts(ids,function(err,content){
							if (!err) {

							}else {
								return reply({"success":false,"message":results.message,"service_info":service_info});
							}
						});
					}else {
						return reply({"success":false,"message":"购物车查不到"});
					}
				});
			}
		},
		//保存订单，分单
		{
			method: 'POST',
			path: '/save_order_infos',
			handler: function(request, reply){
				var person_id = request.payload.person_id;
				var total_data = request.payload.total_data;
				var shopping_carts = request.payload.shopping_carts;
				var send_seller = request.payload.send_seller;
				var address = request.payload.address;
				var id = request.payload.id;
				if (!person_id || !total_data || !shopping_carts) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				shopping_carts = JSON.parse(shopping_carts);
				total_data = JSON.parse(total_data);
				var ids = [];
				for (var i = 0; i < shopping_carts.length; i++) {
					ids.push(shopping_carts[i].id);
				}
				ids = JSON.stringify(ids);
				//根据页面的购物车对象中的id查询数据库的购物车和产品信息
				var data_base_carts;
				var data_base_total_data;
				var data_base_products;
				search_selected_carts(person_id,ids,function(err,results){
					if (!err) {
						data_base_carts = results.shopping_carts;
						data_base_products = results.products;
						data_base_total_data = results.total_data;
						//和页面传的购物车里信息核实
						for (var i = 0; i < shopping_carts.length; i++) {
							var per_price = shopping_carts[i].per_price;
							//商品单价对比
							if (shopping_carts[i].product_id == data_base_products[shopping_carts[i].product_id].id) {
								if (per_price != data_base_products[shopping_carts[i].product_id].product_sale_price) {
									return reply({"success":false,"message":"商品价格有问题！"});
								}
							}
						}
						//商品总数，总价对比
						if (total_data.total_prices != data_base_total_data.total_prices || total_data.total_items != data_base_total_data.total_items) {
							return reply({"success":false,"message":"商品总价或者数量有问题！"});
						}
						var gain_point = data_base_total_data.total_prices;
						var products_price = data_base_total_data.total_prices;
						var total_number = data_base_total_data.total_items;
						var weight = data_base_total_data.total_weight;
						var order_status = -1;
						//details data
						var products = data_base_products;
						var origin = "ec_mp";
						if (!weight) {
							weight = 0;
						}
						var info = {
							"type" : JSON.parse(address).type,
							"store_id" : JSON.parse(address).store_id,
							"point_id" : JSON.parse(address).point_id,
							"weight" : weight,
							"order_amount" : total_number,
							"end_province" :JSON.parse(address).province,
							"end_city" : JSON.parse(address).city,
							"end_district" : JSON.parse(address).district
						};

						logistics_payment(info,function(err,result){
							if (!err) {
								var lgtic_pay = result.row.user_amount;
								if (!lgtic_pay && lgtic_pay!=0) {
									lgtic_pay = 150;
								}else {
									amount = lgtic_pay;
								}
								var actual_price = amount + products_price;
								generate_order_no("ec_order",function(err,row){
									if (!err) {
										order_id = row.order_no;
										server.plugins['models'].ec_orders.save_order_infos(id,order_id,person_id,gain_point,products_price,total_number,weight,order_status,origin,amount,actual_price,send_seller,address,function(err,results){
											if (!err){
												for (var i = 0; i < shopping_carts.length; i++) {
													var product_id = shopping_carts[i].product_id;
													var order_index = i+1;
													var number = shopping_carts[i].total_items;
													var price = products[shopping_carts[i].product_id].product_sale_price;
													var marketing_price = products[shopping_carts[i].product_id].product_marketing_price;
													var total_price = price * number;
													var sku_id = shopping_carts[i].sku_id;
													server.plugins['models'].ec_orders_details.save_ec_order_details(order_id,product_id,order_index,number,price,marketing_price,total_price,sku_id,function(err,results){
														if (!err){

														}else {
															return reply({"success":false,"message":results.message,"service_info":service_info});
														}
													});
												}
												delete_shopping_carts(ids,function(err,content){
													if (!err) {
														return reply({"success":true,"order_id":order_id,"service_info":service_info});
													}else {
														return reply({"success":false,"message":results.message,"service_info":service_info});
													}
												});
											}else {
												return reply({"success":false,"message":results.message,"service_info":service_info});
											}
										});
									}else {
										return reply({"success":false,"message":row.message,"service_info":service_info});
									}
								});
							}else {
								return reply({"success":false,"message":result.message,"service_info":service_info});
							}
						});
					}else {
						return reply({"success":false,"message":"购物车查不到"});
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
