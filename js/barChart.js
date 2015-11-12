

//the view that constructs a linechart
var BarChart = ChartBase.extend({
	defaults: _.defaults({
		someNewDefault: "yes"
	}, ChartBase.prototype.defaults),
	//setup the scales
	xScaleMin:function(){
		return d3.min(this.data.models, function(c) { return d3.min(c.get('values').models, function(v) { return v.get('date'); }); })
	},
	xScaleMax:function(){
		return d3.max(this.data.models, function(c) { return d3.max(c.get('values').models, function(v) { return v.get('date'); }); })
	},
	xScaleRange:function(){
		var objectNumber = this.numberOfObjects();
		if (this.chartLayout =="stackPercent" ||  this.chartLayout == "stackTotal"){objectNumber =1}
		var range = [(this.widthOfBar()*objectNumber)/2, this[this.switchWidth] - this.widthOfBar()*objectNumber]
		if (this.chartLayout == "sideBySide"){
			range = [0, (this.width/(this.data.models.length * (1+ (2 / (this.data.models[0].get('values').models.length) ) ) ) )]
		}
		return range;
	},
	getXScale: function() {
		if (this.hasTimeScale == true){
				return d3.time.scale()
					.domain([this.xScaleMin(),this.xScaleMax()])
					.range(this.xScaleRange())
			}else{
				return d3.scale.ordinal()
				.domain(this.data.models[0].get('values').models.map(function(d) { return d.get('category')}))
				.rangeRoundBands([0, this[this.switchWidth]], 0);
			}
	},
	yScaleMin:function(){
		var self=this;
		//find the minimum value, if greater than 0, return 0
		var min = d3.min(this.data.models, function(c) { return d3.min(c.get('values').models, function(v) { return v.get(self.dataType); }); });
		if (min > 0){min = 0}
		if (this.chartLayout == "stackTotal" || this.chartLayout == "stackPercent"){min = 0}
		return min;
	},
	yScaleMax:function(){
		var theValues = this.dataType;
		if (this.chartLayout == "stackTotal"){theValues = "stackTotal"}
		var max = d3.max(this.data.models, function(c) { return d3.max(c.get('values').models, function(v) { return v.get(theValues); }); })
		if (this.chartLayout == "stackPercent"){console.log("you are in here"); max = 100}
		return max
	},
	getYScale: function() {
		var rangeLow = this[this.switchHeight];
		var rangeHigh = 0
		if (this.horizontal == "yes"){
			var rangeLow = 0;
			var rangeHigh = this[this.switchHeight]-15			
		}
		
		if (this.autoScale == "yes" || this.hasZoom == "yes"){
			return d3.scale.linear()
				.domain([this.yScaleMin(),this.yScaleMax()])
				.nice()
				.range([rangeLow, rangeHigh])
		}else{			
			return d3.scale.linear()
				.domain([this.yScaleVals[0],this.yScaleVals[this.yScaleVals.length - 1]])
				.range([rangeLow, rangeHigh])
		}
	},
	renderChart: function (){
		var self = this;
		//set data to the data in the model
		var data = this.data;


		//if there is a zoom, then setup the zoom
		if (self.hasZoom == "yes"){								
			//define the zoom
			var zoom = d3.behavior.zoom()
		    	.x(self.scales.x)
			    .y(self.scales.y)
			    .scaleExtent([1,8])
			    .on("zoom", zoomed);
		
			//call the zoom on the SVG
		    self.svg.call(zoom);
		
			//define the zoom function
			function zoomed() {		    	
		    	self.svg.select(".x.axis").call(self.xAxis);
			    self.svg.select(".y.axis").call(self.yAxis);
		
				self.svg.selectAll(".barChart")					
					.data(self.data.models, function(d) { return(d.get('name'));})
					.selectAll(".bar")
			        .data(function(d) {return(d.get('values').models);})
					 .attr(self.switchY, function(d) { 
					 	  	var minOrMax = "max";
					 	  	if (self.horizontal =="yes"){
						 	  	minOrMax = "min";
					 	  	}
					 	  	return self.scales.y(Math[minOrMax](0, d.get(self.dataType))); 
					 })
			 	    .attr(self.switchHeight, function(d) { return Math.abs(self.scales.y(d.get(self.dataType)) - self.scales.y(0)); })
			 		.attr(self.switchWidth, self.widthOfBar()) 
				    .attr(self.switchX, function(d, i, j) {
						   var theScale = 'category';
						   var modifier = 0; 
						   if (self.hasTimeScale == true) {
						   		theScale = 'date'
						   		modifier = (self.widthOfBar()*self.numberOfObjects()/2);
						   	} 
						   	return ((self.scales.x(d.get(theScale)) - (j*self.widthOfBar()))+(self.widthOfBar()*(self.numberOfObjects()-1)))-modifier 
					  })

									
				var recessionDateParse = d3.time.format("%m/%d/%Y").parse;
				self.svg.selectAll(".recessionBox")
					.attr("x", function (d) {  return self.scales.x(recessionDateParse(d.start))})
					.attr("width", function (d) {return (self.scales.x(recessionDateParse(d.end))) - (self.scales.x(recessionDateParse(d.start)))});
			}													
		}	
			
			
			
			self.xBarPosition = function(d, i, j) {
					   var theScale = 'category';
					   var modifier = 0; 
					   if (self.hasTimeScale == true) {
					   		theScale = 'date'
					   		modifier = (self.widthOfBar()*self.numberOfObjects()/2);
					   	}

					   	if (self.chartLayout == "stackTotal" || self.chartLayout =="stackPercent" || self.chartLayout == "sideBySide"){
						  if (self.hasTimeScale == true){ modifier = (self.widthOfBar()/2);}
						  return (self.scales.x(d.get(theScale))) -modifier
					   	}else{
						   if (self.chartLayout == "onTopOf"){
							   return self.scales.x(d.get(theScale)) - modifier   
						   }else{
						   		return ((self.scales.x(d.get(theScale)) - (j*self.widthOfBar()))+(self.widthOfBar()*(self.numberOfObjects()-1)))-modifier   
						   	}
					   	}
			}
			self.yBarPosition = function(d){
				if ( isNaN(d.get(self.dataType)) == true){return 0}
				var positioner = "y1"
				if (self.horizontal =="yes"){ positioner = "y0"}
				if (self.chartLayout == "stackTotal"){ 
					return self.scales.y(d.get(positioner+"Total"));
				}else{
					if (self.chartLayout == "stackPercent"){
						return self.scales.y(d.get(positioner+"Percent"));					
					}else{
					 	var minOrMax = "max";
				 	  	if (self.horizontal =="yes"){
					 	  	minOrMax = "min";
				 	  	}
				 	  	return self.scales.y(Math[minOrMax](0, d.get(self.dataType))); 
				 	}				
				}
			}
			self.barHeight = function(d){
				if ( isNaN(d.get(self.dataType)) == true){return 0}
				if (self.chartLayout == "stackTotal"){ 
					return Math.abs(self.scales.y(d.get("y0Total")) - self.scales.y(d.get("y1Total")));
				}else{
					if (self.chartLayout == "stackPercent"){
						return Math.abs(self.scales.y(d.get("y0Percent")) - self.scales.y(d.get("y1Percent")));
					}else{
				 	return Math.abs(self.scales.y(d.get(self.dataType)) - self.scales.y(0));
				 	}									
				 }
			}

			self.barFill = function (d){
				  	if (self.colorUpDown == "yes"){
					  	if (d.get(self.dataType) > 0){
						  	return self.lineColors[0];
					  	}else{
						  	return self.lineColors[1]
					  	}					  						  	
				  	}else{
					  	return self.color(d.get("name"))
				  }
			}
			//enter g tags for each set of data, then populate them with bars.  some attribute added on end, for updating reasons
			var barChart = self.svg.selectAll(".barChart")
		      	.data(self.data.models, function(d) { return(d.get('name'));})
			  	.enter().append("g")
		  	  	.attr("clip-path", "url(#clip" + self.targetDiv + ")")
		      	.attr("class", "barChart")
		      	.attr('id',function(d){ return self.targetDiv + d.get("name") + "-bar"; })

			 if (self.chartLayout =="sideBySide"){
		      	barChart.attr("transform", function(d,i){
				  	return 	"translate(" + (i*(self.width/self.numberOfObjects())) + ",0)"				  	
			  	});
			 }
			barChart.selectAll(".bar")
			      .data(function(d) {return(d.get('values').models);})
			      .enter().append("rect")
			      .attr("class", "bar")
				  .style("fill", self.barFill)
			      .attr(self.switchHeight, 0)
			      .attr(self.switchY, self.scales.y(0))
			      .attr(self.switchWidth, self.widthOfBar()) 
				  .attr(self.switchX, function (d,i,j){					  					  				  	
				  	return self.xBarPosition(d,i,j)
				  	})
			 	  .attr("fill-color", self.barFill)
			      .transition()
			      .duration(1000)
			 	  .attr(self.switchY, self.yBarPosition)
			 	  .attr(self.switchHeight, self.barHeight);


			var circleChart = self.svg.selectAll(".circleChart")
		      	.data(self.data.models, function(d) { return(d.get('name'));})
			  	.enter().append("g")
		      	.attr("class", "circleChart")
		      	.attr('id',function(d){ return self.targetDiv + d.get("name") + "-circle"; })

			circleChart.selectAll(".coalition")
			      .data(function(d) {return(d.get('values').models);})
			      .enter().append("rect")
			      .attr("class", "coalition")
				  .attr("width", function(d){
					  if (d.get("coalition") == "Y"){ return 4}else {return 0}
				  })
				  .attr("height", function(d){
					  if (d.get("coalition") == "Y"){ return 4}else {return 0}
				  })
				  .attr("y", self.height+4)
				  .attr("x", function(d){
					  return self.scales.x(d.get("date"))-1 
				   })
			

		self.svg.append("svg:g")
		    .attr("class", "x axis");		
	    self.svg.select(".x.axis")
	        .attr("transform", "translate(0," + self.height + ")")
	        .call(self.xAxis);
		self.svg.append("svg:g")
		    .attr("class", "y axis");			
	    self.svg.select(".y.axis")
	    	.call(self.yAxis); 
	
	self.dataLabels = self.YTickLabel[self.YTickLabel.length-1]
	
	self.topTick = function(tickLabels){
		var topTick = d3.selectAll("#" + self.targetDiv + " ."+self.switchY+".axis .tick:last-of-type")
		var toptickWidth = $("#" + self.targetDiv + " ."+self.switchY+".axis .tick:last-of-type text").width();

		topTick.append("text")
			.attr("class", "topTick")
			.style("text-anchor","end")
			.text(tickLabels[0])
			.attr("transform", function(d){				
				if (self.horizontal == "yes"){
					return "translate("+(0-(toptickWidth/2))+",18)"
				}else{
					return "translate("+(0-(toptickWidth+8))+",4.5)"					
				}
			})
			
		var addRect = topTick.append("rect")
			.attr("class", "topTick")
			.style("fill", "#FFFFFF")
			.attr("height",10)
			.attr("y",-5)
			
		topTick.append("text")
			.style("text-anchor",function(){if (self.horizontal == "yes"){return "end"}else{return "start"}})
			.attr("class", "topTick")
			.text(tickLabels[1])
			.attr("transform", function(d){
				if (self.horizontal == "yes"){
					return "translate("+(0+(toptickWidth/2))+",32)"
				}else{
					if (tickLabels[1].length == 1){
						return "translate(-8,4.5)"
					}else{
						return "translate(-4,4.5)"
					}					
				}
			})
			.classed("topTickPost", true)
		var toptickBoxWidth = $("#" + self.targetDiv + " ."+self.switchY+".axis .tick:last-of-type text.topTickPost").width();
		addRect.attr("width",toptickBoxWidth+4)
	
	}
	self.topTick(self.dataLabels)


		self.update = function (){

				if (self.hasTimeScale == true){
					self.scales.x.domain([self.xScaleMin(),self.xScaleMax()]).range(this.xScaleRange())					
				}

				if (self.autoScale =="yes"){
					self.scales.y.domain([self.yScaleMin(),self.yScaleMax()]).nice()	
				}


				 
			      	barChart
			      	.data(self.data.models, function(d) {return(d.get('name'));})
			      	.order()
			      	.transition()
			      	.duration(1000)
			      	.attr("transform", function(d,i){
					  	var xPosit = 0;
					  	if (self.chartLayout =="sideBySide"){
						  	xPosit = (i*(self.width/self.numberOfObjects()))
					  	}
					  	return 	"translate(" + xPosit + ",0)"				  	
				  	});


				 if (self.hasLegend =="yes"){
				//update the legend
				var depth = 0;
			    self.legendItems
				    .data(self.data.models, function(d) {return(d.get('name'));})
					.transition()
					.duration(500)
					.style("margin-top", function(d,i){					
							var returnDepth = depth;
							depth += $(this).height()+10
							return returnDepth+"px";	
					})

				self.legendItems
				    .data(self.data.models, function(d) {return(d.get('name'));})
					.transition()
					.duration(500)
					.style("margin-top", function(d,i){					
							var returnDepth = depth;
							depth += $(this).height()+10
							return returnDepth+"px";	
					})

				}

				barChart
					.data(self.data.models, function(d) { return(d.get('name'));})
			        .exit()
					.selectAll(".bar")
			        .transition()
				    .attr(self.switchHeight, 0)
			        .attr(self.switchY, self.scales.y(0))
							
			       			
				self.svg.selectAll(".barChart")					
					.data(self.data.models, function(d) { return(d.get('name'));})
					.selectAll(".bar")
			        .data(function(d) {return(d.get('values').models);})
			        .transition()
			        .duration(1000)
 				    .style("fill", self.barFill)
					.attr(self.switchY, self.yBarPosition)
			 	    .attr(self.switchHeight, self.barHeight)
			 		.attr(self.switchWidth, self.widthOfBar()) 
					.attr(self.switchX, function (d,i,j){
					  	return self.xBarPosition(d,i,j)
					 })


				// update the axes,   
			    if (self.autoScale =="yes"){
				    self.svg.select("."+self.switchY+".axis")
				    	.transition()
				    	.duration(1000)
				    	.call(self[self.switchY+"Axis"]);   			          
				}
				self.svg.select("."+self.switchX+".axis")
			    	.transition()
			    	.duration(1000)
			    	.call(self[self.switchX+"Axis"]);					

				 d3.selectAll("#" + self.targetDiv + " .topTick")
								.remove()
				self.topTick(self.dataLabels)
								
				//recessions				
				var recessionDateParse = d3.time.format("%m/%d/%Y").parse;
				self.svg.selectAll(".recessionBox")
					.attr("x", function (d) {  
						return self.scales.x(recessionDateParse(d.start))
					})
					.attr("width", function (d) {
						return (self.scales.x(recessionDateParse(d.end))) - (self.scales.x(recessionDateParse(d.start)))
					});			        

		}
								
				/*make the dark zero axis on top FIGURE THIS OUT
				var yAxiszero = d3.svg.axis()
			    	.scale(self.scales.y)
				    .orient("left")
				    .tickValues([0])
				    .tickSize(0-self.width)
				    .tickPadding(8)
				    self.svg.append("svg:g")
				    .attr("class", "y axiszero");
				
			    self.svg.select(".y.axiszero")
			    	.call(yAxiszero); 
				*/	
							
	  

			//make my tooltips work
		//	$('.bar').tipsy({opacity:.9, gravity:'sw', html:true});
			
	
			
		
	//end of render
	}
//end of mdoel
});
