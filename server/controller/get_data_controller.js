/**
 ┌──────────────────────────────────────────────────────────────┐
 │               ___ ___ ___ ___ ___ _  _ ___ ___               │
 │              |_ _/ _ \_ _/ _ \_ _| \| | __/ _ \              │
 │               | | (_) | | (_) | || .` | _| (_) |             │
 │              |___\___/___\___/___|_|\_|_| \___/              │
 │                                                              │
 │                                                              │
 │                       set up in 2015.2                       │
 │                                                              │
 │   committed to the intelligent transformation of the world   │
 │                                                              │
 └──────────────────────────────────────────────────────────────┘
*/

var _ = require('lodash');
var moment = require('moment');
var eventproxy = require('eventproxy');
var service_info = "ec order service";
var moduel_prefix = 'get_data_controller';

exports.register = function(server, options, next) {
    server.route([
        //获取所有线上订单信息
        {
            method: 'GET',
            path: '/get_online_orders_data',
            handler: function(request, reply) {
                var date = {};
                if (request.query.date1) {
                    date.date1 = request.query.date1;
                }
                if (request.query.date2) {
                    date.date2 = request.query.date2;
                }
                server.plugins['models'].ec_orders.get_online_orders_data(date, function(err,rows){
                    if (!err) {
                        return reply({"success":true,"rows":rows,"service_info":service_info});
                    }else {
                        return reply({"success":false,"message":rows.message,"service_info":service_info});
                    }
                });
            },
        },
        //获取所有线下订单信息
        {
            method: 'GET',
            path: '/get_offline_orders_data',
            handler: function(request, reply) {
                var date = {};
                if (request.query.date1) {
                    date.date1 = request.query.date1;
                }
                if (request.query.date2) {
                    date.date2 = request.query.date2;
                }
                server.plugins['models'].orders.get_offline_orders_data(date, function(err,rows){
                    if (!err) {
                        return reply({"success":true,"rows":rows,"service_info":service_info});
                    }else {
                        return reply({"success":false,"message":rows.message,"service_info":service_info});
                    }
                });
            },
        },

    ]);

    next();
}

exports.register.attributes = {
    name: moduel_prefix
};
