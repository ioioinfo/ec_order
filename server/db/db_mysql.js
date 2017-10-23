var mysql = require('mysql');

// Base routes for default index/root path, about page, 404 error pages, and others..
exports.register = function(server, options, next){

	var pool  = mysql.createPool({
		connectionLimit : 10,
		host            : '127.0.0.1',
		port            :  3306,
		user            : 'uuinfo',
		password        : '123321',
		database        : 'ec_order',
		charset         : 'utf8_general_ci'
	});

	server.expose('pool', pool);

	var query = function(sql,values,callback) {
		var cb = callback;
		if (typeof values === 'function') {
			cb = values;
		}
		pool.getConnection(function(err, connection) {
			var handler = function(err, rows) {
				 connection.release();
				 cb(err, rows);
			};
			if (typeof values === 'function') {
			 	connection.query(sql, handler);
			} else {
			 	connection.query(sql, values, handler);
			}
		});
	};
	server.expose('query', query);
	 next();
}

exports.register.attributes = {
    name: 'mysql'
};
