const uu_request = require('../utils/uu_request');
const uuidV1 = require('uuid/v1');
var service_info = "ec order service";
var eventproxy = require('eventproxy');
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

//选中购物车信息
var search_selected_carts = function(person_id,ids,cb){
	var url = "http://127.0.0.1:18015/search_selected_carts?person_id=";
	url = url + person_id + "&ids=" + ids;
	do_get_method(url,cb);
};
//删除购物车
var delete_shopping_carts = function(data,cb){
	var url = "http://127.0.0.1:18015/delete_shopping_carts";
	do_post_method(url,data,cb);
};
//批量查询商品信息
var find_products_with_picture = function(product_ids,cb){
	var url = "http://127.0.0.1:18002/find_products_with_picture?product_ids="+product_ids;
	do_get_method(url,cb);
};
//生成批次
var get_latest_batch_no = function(cb){
	var url = "http://211.149.248.241:16022/purchase/get_latest_batch_no?org_code=ioio";
	do_get_method(url,cb);
};
//查询产品分类
var get_product_sorts = function(product_ids,cb){
	var url = "http://127.0.0.1:18002/get_product_sorts?product_ids="+product_ids;
	do_get_method(url,cb);
};
exports.register = function(server, options, next){
	//查询ol所有明细
	var search_online_order_details = function(order_ids,cb){
		server.plugins['models'].online_orders_details.search_online_order_details(order_ids,function(err,results){
			cb(err,results);
		});
	};
	server.route([
		//获取所有带批次的商品信息
        {
            method: "GET",
            path: '/search_batch_products_infos',
            handler: function(request, reply) {
				get_latest_batch_no(function(err,row){
					if (!err) {
						var batch_no = row.row.batch_no;
						server.plugins['models'].online_orders.search_all_batch_orders(function(err,rows){
		                    if (!err) {
								var data_map = {};
								var batch_list = [];
								if (rows.length == 0) {
									return reply({"success":true,"batch_list":batch_list,"data":data,"service_info":service_info});
								}else {
									for (var i = 0; i < rows.length; i++) {
										if (!data_map[rows[i].batch_no]) {
											var data = {
												"order_ids" : [],
												"num" : 0,
												"jine" : 0.0
											};
											data_map[rows[i].batch_no] = data;
											batch_list.push(rows[i].batch_no);
										}
										data_map[rows[i].batch_no].order_ids.push(rows[i].order_id);
										data_map[rows[i].batch_no].num = data_map[rows[i].batch_no].num + rows[i].total_number;
										data_map[rows[i].batch_no].jine = data_map[rows[i].batch_no].jine + rows[i].actual_price;
									}
									var order_ids = data_map[batch_no].order_ids;
									server.plugins['models'].online_orders_details.search_online_order_details(order_ids,function(error,content){
										if (!error) {
											var product_map = {};
											var product_ids = [];
											for (var i = 0; i < content.length; i++) {
												var order_detail = content[i];
												if (!product_map[order_detail.product_id]) {
													var data = {
														"num" : 0,
														"jine" : 0.0
													};
													product_map[order_detail.product_id] = data;
													product_ids.push(order_detail.product_id);
												}
												product_map[order_detail.product_id].num = product_map[order_detail.product_id].num + order_detail.number;
												product_map[order_detail.product_id].jine = product_map[order_detail.product_id].jine + order_detail.total_price;

											}
											product_ids = JSON.stringify(product_ids);
											get_product_sorts(product_ids,function(err,rows){
												if (!err) {
													var sort_list = rows.rows;
													for (var i = 0; i < sort_list.length; i++) {
														sort_list[i].jine = 0.0;
														sort_list[i].num = 0;
														for (var j = 0; j < sort_list[i].product_ids.length; j++) {
															var id = sort_list[i].product_ids[j];
															sort_list[i].jine = sort_list[i].jine + product_map[id].jine;
															sort_list[i].num = sort_list[i].num + product_map[id].num;
														}
													}

													return reply({"success":true,"rows":sort_list,"service_info":service_info});
												}else {
													return reply({"success":false,"message":rows.message,"service_info":service_info});
												}
											});
										}else {
											return reply({"success":false,"message":content.message,"service_info":service_info});
										}
									});
								}
							}else {
								return reply({"success":false,"message":rows.message,"service_info":service_info});
							}
						});
					}else {
						return reply({"success":false,"message":row.message,"service_info":service_info});
					}
				});
            }
        },
		//获取最新批次信息
        {
            method: "GET",
            path: '/search_lastest_batch_infos',
            handler: function(request, reply) {
				get_latest_batch_no(function(err,row){
					if (!err) {
						var batch_no = row.row.batch_no;
						server.plugins['models'].online_orders.search_all_batch_orders(function(err,rows){
		                    if (!err) {
								var data_map = {};
								var batch_list = [];
								if (rows.length == 0) {
									return reply({"success":true,"row":{},"service_info":service_info});
								}else {
									for (var i = 0; i < rows.length; i++) {
										if (!data_map[rows[i].batch_no]) {
											var data = {
												"batch_no": batch_no,
												"order_ids" : [],
												"num" : 0,
												"jine" : 0.0
											};
											data_map[rows[i].batch_no] = data;
											batch_list.push(rows[i].batch_no);
										}
										data_map[rows[i].batch_no].order_ids.push(rows[i].order_id);
										data_map[rows[i].batch_no].num = data_map[rows[i].batch_no].num + rows[i].total_number;
										data_map[rows[i].batch_no].jine = data_map[rows[i].batch_no].jine + rows[i].actual_price;
									}
									return reply({"success":true,"row":data_map[batch_no],"service_info":service_info});
								}
							}else {
								return reply({"success":false,"message":rows.message,"service_info":service_info});
							}
						});
					}else {
						return reply({"success":false,"message":row.message,"service_info":service_info});
					}
				});
            }
        },
		//根据personid 和批次 获取订单
		{
			method: 'GET',
			path: '/search_online_batch_orders',
			handler: function(request, reply){
				var person_id = request.query.person_id;
				var batch_no = request.query.batch_no;
				if (!person_id || !batch_no) {
					return reply({"success":false,"message":"person_id or batch_no null","service_info":service_info});
				}
				server.plugins['models'].online_orders.search_online_batch_orders(person_id, batch_no,function(err,results){
					if (!err) {
						if (results.length===0) {
							return reply({"success":false,"message":"没有订单","service_info":service_info});
						}
						var order_ids = [];
						for (var i = 0; i < results.length; i++) {
							order_ids.push(results[i].order_id);
						}
						server.plugins['models'].online_orders_details.search_online_order_details(order_ids,function(error,content){
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
						for (var i = 0; i < rows.length; i++) {
							rows[i].order_status = order_status[rows[i].order_status];
						}
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
				var person_id = request.payload.person_id;
				var total_data = request.payload.total_data;
				var shopping_carts = request.payload.shopping_carts;
				if (!person_id || !total_data || !shopping_carts) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				shopping_carts = JSON.parse(shopping_carts);
				total_data = JSON.parse(total_data);
				var ids = [];
				for (var i = 0; i < shopping_carts.length; i++) {
					ids.push(shopping_carts[i].id);
				}
				get_latest_batch_no(function(err,row){
					if (!err) {
						var batch_no = row.row.batch_no;
						search_selected_carts(person_id,JSON.stringify(ids),function(err,results){
							if (!err) {
								var data_base_carts = results.shopping_carts;
								var data_base_products = results.products;
								var data_base_total_data = results.total_data;
								var products = data_base_products;
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
								if (total_data.total_prices != data_base_total_data.total_prices ) {
									return reply({"success":false,"message":"商品总价有问题！"});
								}
								if (total_data.total_items != data_base_total_data.total_items) {
									return reply({"success":false,"message":"商品总数量有问题！"});
								}

								generate_order_no(function(err,row){
									if (!err) {
										var order = {
											"person_id":person_id,
											"products_price":data_base_total_data.total_prices,
											"total_number":data_base_total_data.total_items,
											"weight":data_base_total_data.total_weight,
											"actual_price":data_base_total_data.total_prices
										};
										if (!order.weight) {
											order.weight = 0;
										}
										order.order_id = row.order_no;
										order.id = uuidV1();
										order.batch_no = batch_no;
										server.plugins['models'].online_orders.save_online_orders(order, function(err,result){
											if (result.affectedRows>0) {
												for (var i = 0; i < shopping_carts.length; i++) {
													var price = products[shopping_carts[i].product_id].product_sale_price;
													var number = shopping_carts[i].total_items;
													var order_detail = {
														"order_id" : order.order_id,
														"product_id" : shopping_carts[i].product_id,
														"order_index" :i+1,
														"number" : number,
														"price" : price,
														"marketing_price" : products[shopping_carts[i].product_id].product_marketing_price,
														"total_price" : price * number,
														"sku_id": shopping_carts[i].sku_id
													};
													server.plugins['models'].online_orders_details.save_online_orders_detail(order_detail, function(err,result){
														if (result.affectedRows>0) {

														}else {
															return reply({"success":false,"message":result.message,"service_info":service_info});
														}
													});
												}
												ids = JSON.stringify(ids);
												var data = {"ids":ids};
												delete_shopping_carts(data,function(err,content){
													if (!err) {
														return reply({"success":true,"order_id":order.order_id,"service_info":service_info});
													}else {
														return reply({"success":false,"message":results.message,"service_info":service_info});
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

							}else {
								return reply({"success":false,"message":"购物车查不到"});
							}
						});

					}else {
						return reply({"success":false,"message":row.message,"service_info":service_info});
					}
				});

            }
        },
		//id查询
        {
            method: "GET",
            path: '/search_online_by_id',
            handler: function(request, reply) {
                var id = request.query.id;
                if (!id) {
                    return reply({"success":false,"message":"id null","service_info":service_info});
                }
                var info2 = {};
                var ep =  eventproxy.create("rows",
                    function(rows){
						for (var i = 0; i < rows.length; i++) {
							rows[i].order_status = order_status[rows[i].order_status];
						}
                    return reply({"success":true,"rows":rows,"service_info":service_info});
                });
                //查询渠道部门
                server.plugins['models'].online_orders.search_online_by_id(id,function(err,rows){
                    if (!err) {
                        ep.emit("rows", rows);
                    }else {
                        ep.emit("rows", []);
                    }
                });
            }
        },
		//person_id查询
		{
			method: "GET",
			path: '/search_online_by_personid',
			handler: function(request, reply) {
				var person_id = request.query.person_id;
				if (!person_id) {
					return reply({"success":false,"message":"person_id null","service_info":service_info});
				}
				var info2 = {};
				var ep =  eventproxy.create("rows",
					function(rows){
						for (var i = 0; i < rows.length; i++) {
							rows[i].order_status = order_status[rows[i].order_status];
						}
					return reply({"success":true,"rows":rows,"service_info":service_info});
				});
				//查询渠道部门
				server.plugins['models'].online_orders.search_online_by_personid(person_id,function(err,rows){
					if (!err) {
						ep.emit("rows", rows);
					}else {
						ep.emit("rows", []);
					}
				});
			}
		},
		//删除订单
		{
			method: 'POST',
			path: '/delete_online',
			handler: function(request, reply){
				var id = request.payload.id;
				if (!id) {
                    return reply({"success":false,"message":"id null","service_info":service_info});
                }
				server.plugins['models'].online_orders.delete_online(id,function(err,row){
					if (row.affectedRows>0) {
						return reply({"success":true,"message":"ok","service_info":service_info});
					}else {
						return reply({"success":false,"message":row.message,"service_info":service_info});
					}
				});
			}
		},
		//更新订单状态
		{
			method: 'POST',
			path: '/update_online_status',
			handler: function(request, reply){
				var id = request.payload.id;
				var order_status = request.payload.order_status;
				if (!id ||!order_status) {
					return reply({"success":false,"message":"params null","service_info":service_info});
				}
				server.plugins['models'].online_orders.update_online_status(id,order_status,function(err,results){
					if (!err) {
						return reply({"success":true,"message":"ok","service_info":service_info});
					}else {
						return reply({"success":false,"message":results.message,"service_info":service_info});
					}
				});
			}
		},
		//批量查明细 完整版，带订单，带产品
		{
			method: 'GET',
			path: '/search_ol_orders_infos',
			handler: function(request, reply){
				var order_ids = request.query.order_ids;
				if (!order_ids) {
					return reply({"success":false,"message":"order_ids null","service_info":service_info});
				}
				order_ids = JSON.parse(order_ids);
				server.plugins['models'].online_orders.search_online_orders(order_ids,function(err,results){
					if (!err) {
						if (results.length===0) {
							return reply({"success":false,"message":"没有订单","service_info":service_info});
						}
						server.plugins['models'].online_orders_details.search_online_order_details(order_ids,function(error,content){
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
		//查询订单根据person_id,status
		{
			method: 'GET',
			path: '/search_online_by_status',
			handler: function(request, reply){
				var status = request.query.status;
				var person_id = request.query.person_id;
				if (!status || !person_id) {
					return reply({"success":false,"message":"params null","service_info":service_info});
				}
				status = JSON.parse(status);
				server.plugins['models'].online_orders.search_online_by_status(person_id,status,function(err,results){
					if (!err) {
						if (!results || results.length == 0) {
							return reply({"success":true,"message":"ok","orders":results,"details":{},"products":{},"service_info":service_info});
						}
						var order_ids = [];
						for (var i = 0; i < results.length; i++) {
							order_ids.push(results[i].order_id);
							results[i].order_status = order_status[results[i].order_status];
						}
						search_online_order_details(order_ids,function(error,content){
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
									console.log("rows:"+JSON.stringify(rows));
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



	]);

    next();
};

exports.register.attributes = {
    name: 'online_orders_controller'
};
