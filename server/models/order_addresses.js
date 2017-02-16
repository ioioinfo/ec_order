var _ = require('lodash');
var EventProxy = require('eventproxy');

var order_addresses = function(server) {
	return {
		//根据person_id得到地址
		search_order_address: function(person_id,cb){
			var query = `select person_id, receive_name, address, telephone
			from order_addresses where person_id = ? and flag =0`;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, [person_id], function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,results);
						return;
					}
					cb(false,results);
				});
			});
		},



	};
};

module.exports = order_addresses;
