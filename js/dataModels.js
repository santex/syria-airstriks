//a model for each line of data
//basic dataType.  this will get replaced w/ the dataType put on the view, so that the comparator sorts by the right data on each collection
var dataType = "value";

Line = Backbone.Model.extend({	
	defaults: {
		name: undefined,
		rawname:undefined,
		values: undefined, 
	},	
});
//a collection of those lines
Lines = Backbone.Collection.extend({
	comparator: function (item){return -item.get("values").models[item.get("values").models.length-1].get(dataType)},
	model: Line,

});

DataPoint = Backbone.Model.extend({
	defaults:{
		name: undefined,
		rawname:undefined,
		date: undefined,
		y0Total: undefined,
		y1Total:undefined,
		value:undefined,
		valueraw:undefined,
		stackTotal:undefined,
		y0Percent:undefined,
		y1Percent:undefined,
		quarters:undefined,
		daterange:undefined,
		coalition:undefined
	},
	parse: function(point){

		//figure out a better way to do this.  basically if you have a bar chart and you are using categories for scale instead of date, don't want the date function below to fail
		return {
			date: point.date,
			y0Total: point.y0Total,
			y1Total: point.y1Total,	
			name:point.name,
			rawname:point.rawname,
			category:point.category,
			value:point.value,
			valueraw: point.valueraw,	
			stackTotal:point.stackTotal,
			y0Percent:point.y0Percent,
			y1Percent:point.y1Percent,
			quarters:point.quarters,
			daterange:point.daterange,
			coalition:point.coalition
		}
	}
});
//the collection of datapoint which will sort by date.
DataPoints = Backbone.Collection.extend({
	comparator: function(item) {
      //if there is no category field, then sort based on date, else sort on category
      if (item.get("category") ===undefined) {return item.get("date")}else{return item.get("category");}
          },
	model: DataPoint,
	parse: function(data){
		return data;
	}	
});