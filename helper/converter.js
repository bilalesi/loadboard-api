const loadboard = ({documents, response}) => {
    //debugger;
    return new Promise((resolve, reject) => {
        if ( response.reports )
        {
            const tableDocument = documents.map( (doc, index) => {
                //columns
                var rows = [];
                response.reports[0].table.col.forEach(a => {
                    //console.log(a);
                    var accessor = a.accessor;
                    var path = a.path;
                    var data = null;
                    try{
                        //debugger;
                        if ( typeof(path) === "object" )
                        {
                            data = [];
                            for (let x = 0; x < path.length; x++) {
                                const element = path[x];
                                data.push( eval(element) );
                                //debugger;
                            }
                        }
                        else{
                            data = eval(path);
                        }
                        /* if ( typeof(data) == 'boolean' )
                        {
                            data = data.toString();
                        } */
                        data == undefined ? data = null : data;
                    } catch{
                        data = null;
                        //debugger;
                    }
                    // 
                    //return
                    rows = {...rows ,[accessor]: data};
                });
                //console.log(rows);
                //debugger;
                return rows;
            });
            //console.log(tableDocument);
            //debugger;
            response.data = tableDocument;
            response['length'] = tableDocument.length;
        }
        else{
            response.data = documents;
            response['length'] = response.data.length;
        }
        //debugger;
        resolve(response);
    });
};

module.exports = { loadboard: loadboard };