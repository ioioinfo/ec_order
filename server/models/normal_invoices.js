var _ = require('lodash');
var EventProxy = require('eventproxy');

var normal_invoices = function(server) {
	return {
		//获取一个人所有开票信息
		search_ec_invoices: function(person_id,order_ids,cb){
			var query = `select order_id,invoice_name,content,title,created_at
			 from normal_invoices where person_id = ? and order_id in (?) and flag =0`;
		    server.plugins['mysql'].query(query, [person_id,order_ids], function(err, results) {
				if (err) {
					console.log(err);
					cb(true,results);
					return;
				}
				cb(false,results);
			});
		},


	};
};

module.exports = normal_invoices;
