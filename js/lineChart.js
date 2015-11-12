var LineChart = ChartBase.extend ({
	defaults: _.defaults({
		someNewDefault: "yes"
	}, ChartBase.prototype.defaults),
	//setup the scales.  You have to do this in the specific view, it will be called in the chartbase.
	xScaleMin:function(){
		return d3.min(this.data.models, function(c) { return d3.min(c.get('values').models, function(v) { return v.get('date'); }); })
	},
	xScaleMax:function(){
		return d3.max(this.data.models, function(c) { return d3.max(c.get('values').models, function(v) { return v.get('date'); }); })
	},
	getXScale: function() {
		return d3.time.scale()
			.domain([this.xScaleMin(),this.xScaleMax()])
			.range([0, this.width]);
	},
	yScaleMin:function(){
		var theValues = this.dataType;
		if (this.chartLayout == "stackTotal"){theValues = "stackTotal"}
		var min = d3.min(this.data.models, function(c) { return d3.min(c.get('values').models, function(v) { return v.get(theValues); }); })
		if (this.chartlayout == "fillLines"){ if (min > 0){min = 0}}
		if (this.chartLayout == "stackTotal" || this.chartLayout == "stackPercent"){min = 0}
		return min
	},
	yScaleMax:function(){
		var theValues = this.dataType;
		if (this.chartLayout == "stackTotal"){theValues = "stackTotal"}
		var max = d3.max(this.data.models, function(c) { return d3.max(c.get('values').models, function(v) { return v.get(theValues); }); })
		if (this.chartLayout == "stackPercent"){max = 100}
		return max
	},
	getYScale: function() {
		if (this.autoScale == "yes" || this.hasZoom == "yes"){
			return d3.scale.linear()
				.domain([this.yScaleMin(),this.yScaleMax()])
				.nice()
				.range([this.height, 0])
		}else{			
			return d3.scale.linear()
				.domain([this.yScaleVals[0],this.yScaleVals[this.yScaleVals.length - 1]])
				.nice()
				.range([this.height, 0])
		}
	},
	renderChart: function (){
		
		// create a variable called "self" to hold a reference to "this"
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
		
				self.svg.selectAll(".tipCircle")
					.attr("cx", function(d,i){return self.scales.x(d.get('date'))})
					.attr("cy",function(d,i){return self.scales.y(d.get(self.dataType))});
					
				self.svg.selectAll(".line")
		    		.attr("class","line")
		        	.attr("d", function (d) { return line(d.get('values').models)});
				
				var recessionDateParse = d3.time.format("%m/%d/%Y").parse;
				self.svg.selectAll(".recessionBox")
					.attr("x", function (d) {  return self.scales.x(recessionDateParse(d.start))})
					.attr("width", function (d) {return (self.scales.x(recessionDateParse(d.end))) - (self.scales.x(recessionDateParse(d.start)))});
			}													
		}			 
		    			

		//will draw the line		
		var line = d3.svg.line()
	    	.x(function(d) { return self.scales.x(d.get('date')); })
		    .y(function(d) {
		    	if (self.chartLayout == "stackTotal"){
		    		return self.scales.y(d.get("y1Total")); 		    	
		    	}else {
			    	if (self.chartLayout == "stackPercent"){ return self.scales.y(d.get("y1Percent"));}else{return self.scales.y(d.get(self.dataType))} 		    				   		
		    	}			    
		    })
			.interpolate (self.lineType);

		var area = d3.svg.area()
	    	.x(function(d) { return self.scales.x(d.get('date')); })
		    .y0(function(d) { 
		    	if (self.chartLayout == "stackTotal"){
		    		return self.scales.y(d.get("y0Total")); 		    	
		    	}else {
			    	if (self.chartLayout == "stackPercent"){ return self.scales.y(d.get("y0Percent"));}else{return self.scales.y(0)} 		    				   		
		    	}
		    })
		    .y1(function(d) {
		    	if (self.chartLayout == "stackTotal"){
		    		return self.scales.y(d.get("y1Total")); 		    	
		    	}else {
			    	if (self.chartLayout == "stackPercent"){ return self.scales.y(d.get("y1Percent"));}else{return self.scales.y(d.get(self.dataType))} 		    				   		
		    	}
		     })
			.interpolate (self.lineType);
								          
		//bind the data and put in some G elements with their specific mouseover behaviors.
		var lineChart = self.svg.selectAll(".lineChart")
	      	.data(self.data.models, function(d) {return(d.get('name'))})
		  	.enter().append("g")
	  	  	.attr("clip-path", "url(#clip" + self.targetDiv + ")")
	      	.attr("class", "lineChart")
	      	.attr('id',function(d){ return self.targetDiv + d.get("name") + "-line"; })
	      	.on("mouseover", function (d){

			  	//put the line we've hovered on on top
		      	var thisName = d.get("name");
		      	lineChart.sort(function(a,b){
			      	if (a.get("name")==thisName){
				      	return 1
			      	}else{return -1}
		      	}).order()

			  	//class all other lines to be lighter
		      	d3.selectAll("#" + self.targetDiv + " .lineChart")
					.classed('notSelected', true);
				d3.select(this)
					.classed("notSelected", false);	
		      	
	      	})
	      	.on("mouseout", function (d){
		      	d3.selectAll(".lineChart")
					.classed('notSelected', false);
	      	});
		
		  	
	  	lineChart.append("path")
			.attr("class", "line")
	      	.style("stroke", function(d) { return self.color(d.get("name")); })
	      	.attr("d", function(d) {return line(d.get('values').models[0]); })
	      	.transition()
	      	.duration(1500)
	      	.delay(function(d, i) { return i * 100; })
	      	.attrTween('d',function (d){
				var interpolate = d3.scale.quantile()
					.domain([0,1])
					.range(d3.range(1, d.get('values').models.length + 1));
					return function(t){
						return line(d.get('values').models.slice(0, interpolate(t)));
					};
			});			  				  	

		  	lineChart.append("path")
				.attr("class", "area")
		      	.style("fill", function(d) { return self.color(d.get("name")); })
		      	.attr("d", function(d) {return area(d.get('values').models[0]); })
		      	.style("display", function(d){
			      	if (self.chartLayout == "stackTotal" || self.chartLayout == "stackPercent" || self.chartLayout == "fillLines"){
					  	return "block"
				  	}else{return "none"}			      	
		      	})
		      	.transition()
		      	.duration(1500)
		      	.delay(function(d, i) { return i * 100; })
		      	.attrTween('d',function (d){
					var interpolate = d3.scale.quantile()
						.domain([0,1])
						.range(d3.range(1, d.get('values').models.length + 1));
						return function(t){
							return area(d.get('values').models.slice(0, interpolate(t)));
						};
				});									

	  		
	  	if (self.markDataPoints =="yes"){		  
		//then append some 'nearly' invisible circles at each data point  
		lineChart.selectAll(".tipCircle")
			.data( function(d) {return(d.get('values').models);} )
			.enter()
			.append("circle")
			.attr("class","tipCircle")
			.attr("cx", function(d,i){return self.scales.x(d.get('date'))})
			.attr("cy",function(d,i){return self.scales.y(d.get(self.dataType))})
			.attr("r",5)
			.style('opacity', 1)
			.style("fill", function(d) { return self.color(d.get("name")); });//1e-6
		}
		//make my tooltips work
		//$('circle').tipsy({opacity:.9, gravity:'n', html:true});
		
		
		self.update = function (){
			if (self.autoScale =="yes"){
				//update scales
				self.scales.x.domain([this.xScaleMin(),this.xScaleMax()])					
				self.scales.y.domain([self.yScaleMin(),self.yScaleMax()]).nice()	
		    }									
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
					.exit()
					.transition()
					.duration(500)
					.style("margin-top", function(d,i){					
							var returnDepth = depth;
							depth += $(this).height()+10
							return returnDepth+"px";	
					})
				
				var exitLine = d3.svg.line()
					.x(function(d) { return self.scales.x(d.get('date')); })
					.y(function(d) { return  self.margin.bottom+self.height+self.margin.top+10})
					.interpolate (self.lineType);

				var exitArea = d3.svg.area()
					.x(function(d) { return self.scales.x(d.get('date')); })
					.y0(function(d) { return  self.margin.bottom+self.height+self.margin.top+10})
					.y1(function(d) { return  self.margin.bottom+self.height+self.margin.top+10})
					.interpolate (self.lineType);

				//exiting lines
				lineChart
					.data(self.data.models, function(d) { return(d.get('name'));})
			        .exit()
					.selectAll(".line")
			        .transition()
			        .attr("d", function(d,i) { 
			      	    return exitLine(d.get('values').models); 
			         });

				//exiting area
				lineChart
					.data(self.data.models, function(d) { return(d.get('name'));})
			        .exit()
					.selectAll(".area")
			        .transition()
			        .attr("d", function(d,i) { 
			      	    return exitArea(d.get('values').models); 
			         });				
				//update the line				    
			    lineChart.selectAll(".line")
			        .data(self.data.models, function(d) {return(d.get('name'))})
			        .transition()
			        .duration(1000)
			        .attr("d", function(d,i) { 
			      	    return line(d.get('values').models); 
			         });

				//update the area				    
			    lineChart.selectAll(".area")
			        .data(self.data.models, function(d) {return(d.get('name'))})
			        .style("display", function(d){
				      	if (self.chartLayout == "stackTotal" || self.chartLayout == "stackPercent" || self.chartLayout == "fillLines"){
						  	return "block"
					  	}else{return "none"}			      	
			      	})
			        .transition()
			        .duration(1000)
			        .attr("d", function(d,i) { 
			      	    return area(d.get('values').models); 
			         });
				
				//the circles      
				lineChart
					.data(self.data.models, function(d) {return(d.get('name'))})
			        .selectAll(".tipCircle")
			        .data( function(d) {return(d.get('values').models);} )
			        .transition()
			        .duration(1000)
				    .attr("cy",function(d,i){
				    	return self.scales.y(d.get(self.dataType))
				    })
				    .attr("cx", function(d,i){return self.scales.x(d.get('date'))});					 								 						  		
				 
		
				
			  	// update the axes,   
			  	if (self.autoScale=="yes"){
				    self.svg.select(".y.axis")
				    	.transition()
				    	.duration(1000)
				    	.call(self.yAxis);   			          
				    self.svg.select(".x.axis")
				    	.transition()
				    	.duration(1000)
				    	.call(self.xAxis);					
				}

				 d3.selectAll("#" + self.targetDiv + " .topTick")
				.remove()
				setTimeout(function(){				
					self.topTick(self.dataLabels)
				}, 1010)				
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

		//function to recaculate the data and setup a slider if this is rebaseable.
		if (self.rebaseable == "yes"){
									
				var formatDate = d3.time.format("%b, '%y")
				
				d3.select("#"+self.targetDiv)
					.append("div")
					.attr("id", "scale")
					.style("width", self.width +"px")
					.style("margin-left", self.margin.left + "px");					
					
				d3.select("#"+self.targetDiv)
					.append("div")
					.attr("id", "scaleDate")
					.style("width", (self.width)-self.margin.left +"px")
					.html("SLIDE TO VIEW: Change from "+formatDate(self.parseDate(self.rawData[31].date)));	
													
				$("#scale").slider({
					min: 0, 
					max: self.rawData.length-1, 
					value: 0, //default slider value
					step: 1, // step is the allow increments the slider can move. 1 = one month
					slide: function(event, ui) {		

						var formatDate = d3.time.format("%b, '%y")

						d3.select("#"+self.targetDiv + " #scaleDate")
							.html("SLIDE TO VIEW: Change from "+formatDate(self.parseDate(self.rawData[ui.value+1].date)))
					
						self.rebaseData = self.rawData.slice();					
						self.firstItemPosition = ui.value;
						self.dataParse(self.rebaseData);
					 	self.update ();  			 				 													
					}
				});  								
		}													
	//end chart render
	}
//end model
});