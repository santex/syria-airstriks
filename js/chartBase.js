//the view that constructs a linechart
ChartBase = Backbone.View.extend({
	data: undefined,
	lines: undefined,
	data: undefined,
	
	//defaults for all the configurable options
	dataType:'value',
	dataURL: 'data.csv',
	margin: {top: 40, right: 160, bottom: 60, left: 30},
	hasLegend: "yes",
	legendNames:undefined,
	hasZoom: "yes",
	hasRecessions: "no",
	lineType: "linear",
	YTickLabel: [["",""]],
	yScaleVals: [0,100],
	xScaleTicks: 6,
	yScaleTicks:5,
	xTickFormat:undefined,
	yTickFormat:undefined,
	makeTip: undefined,
	lineColors: [selectednav, blue2, purple2, blue3, purple3, teal2, teal4],  
	autoScale: "yes",
	hasMultiData:"no",
	multiDataLabels:["art","garfunkle"],
	multiDataLabelsDisplay:["Unemployed", "Cumulative Change"],
	sheets:"no",
	colorUpDown:"no",
	rebaseable:"no",
	horizontal:"no",
	dateFormat:d3.time.format("%b '%y"),
	numbFormat: d3.format(",.1f"),
	markDataPoints:"no",
	chartLayout:"basic",
	changeChartLayout:"no",
	showTip:"no",	
	
	initialize: function(opts){
		this.options = opts; 
		// if we are passing in options, use them instead of the defualts.
		if(this.options.dataURL){
			this.dataURL = this.options.dataURL;	
		}
		if(this.options.margin){
			this.margin = this.options.margin;	
		}
		if(this.options.dataType){
			this.dataType = this.options.dataType;	
		}
		if(this.options.hasLegend){
			this.hasLegend = this.options.hasLegend;	
		}
		if(this.options.legendNames){
			this.legendNames = this.options.legendNames;	
		}
		if(this.options.hasZoom){
			this.hasZoom = this.options.hasZoom;	
		}
		if(this.options.hasRecessions){
			this.hasRecessions = this.options.hasRecessions;	
		}
		if(this.options.lineType){
			this.lineType = this.options.lineType;	
		}
		if(this.options.YTickLabel){
			this.YTickLabel = this.options.YTickLabel;	
		}
		if(this.options.yScaleVals){
			this.yScaleVals = this.options.yScaleVals;	
		}
		if(this.options.xScaleTicks){
			this.xScaleTicks = this.options.xScaleTicks;	
		}
		if(this.options.makeTip){
			this.makeTip = this.options.makeTip;	
		}
		if(this.options.lineColors){
			this.lineColors = this.options.lineColors;	
		}
		if(this.options.autoScale){
			this.autoScale = this.options.autoScale;	
		}
		if(this.options.hasMultiData){
			this.hasMultiData = this.options.hasMultiData;	
		}
		if(this.options.multiDataLabels){
			this.multiDataLabels = this.options.multiDataLabels;	
		}
		if(this.options.multiDataLabelsDisplay){
			this.multiDataLabelsDisplay = this.options.multiDataLabelsDisplay;	
		}
		if(this.options.sheets){
			this.sheets = this.options.sheets;	
		}
		if(this.options.colorUpDown){
			this.colorUpDown = this.options.colorUpDown;	
		}
		if(this.options.rebaseable){
			this.rebaseable = this.options.rebaseable;	
		}	
		if(this.options.horizontal){
			this.horizontal = this.options.horizontal;	
		}
		if(this.options.yScaleTicks){
			this.yScaleTicks = this.options.yScaleTicks;	
		}
		if(this.options.xTickFormat){
			this.xTickFormat = this.options.xTickFormat;	
		}
		if(this.options.yTickFormat){
			this.yTickFormat = this.options.yTickFormat;	
		}				
		if(this.options.dateFormat){
			this.dateFormat = this.options.dateFormat;	
		}
		if(this.options.numbFormat){
			this.numbFormat = this.options.numbFormat;	
		}
		if(this.options.markDataPoints){
			this.markDataPoints = this.options.markDataPoints;	
		}
		if(this.options.chartLayout){
			this.chartLayout = this.options.chartLayout;	
		}
		if(this.options.changeChartLayout){
			this.changeChartLayout = this.options.changeChartLayout;	
		}
		if(this.options.chartLayoutLables){
			this.chartLayoutLables = this.options.chartLayoutLables;	
		}
		if(this.options.chartLayoutLablesDisplay){
			this.chartLayoutLablesDisplay = this.options.chartLayoutLablesDisplay;	
		}				
		if(this.options.showTip){
			this.showTip = this.options.showTip;	
		}	
		if(this.options.mapData){
			this.mapData = this.options.mapData;	
		}	
		//make a collections forthe data.
		var theSheets;
		var self = this;

			var data = self.dataURL;

			if (data[0].date != undefined){
				if (data[0].date.split('/')[2].length == 2){						
					 this.parseDate = d3.time.format("%m/%d/%y").parse;
				}else{
					this.parseDate = d3.time.format("%m/%d/%Y").parse;						
				}
			}				
			this.rawData = data;
			//parse up the data
			self.firstItemPosition = 0;
			this.dataParse(this.rawData)		
			
			//then it runs the render function
			this.baseRender();
			
			//run the renderChart from the view
			this.renderChart();  
				
		
			
		},

		dataParse: function (data){	
			var self = this;
		//make a collections forthe data.
			this.data = new Lines();

		//if there are multiple types, then map them out
			var getNests = d3.nest()
				.key(function(d) { return d.type; })
				.map(data);
			//figures out names of each type of data.  Use this later to make the labels to click on
			this.nestKeys = d3.keys(getNests)	

			//for loop that that re-arranges each type of data by line then puts each distinct type onto the view
			for (var i = 0; i< this.nestKeys.length; i++){
				this[this.nestKeys[i]] = new Lines();
				this.rawValue = new Lines();
				this.CumulativeChange = new Lines();
				this.changePreMonth = new Lines();
				this.percentChange = new Lines();
				//pull the types of data out one at a time
				var dataHolder = getNests[this.nestKeys[i]];
				//determine how many lines they have and get the line names from column header of CSV
				//loop over line data, make each line and populate it with a name and the values which will be DataPoints collections
				
				var keys = d3.keys(dataHolder[0]).filter(function(key) { return (key !== "date" && key !== "type" && key!== "category" && key!== "quarters"  && key!== "daterange" && key!="coalition"); });
				var keyblob = {}
				y0 = 0;
				y0Stack = 0;			
			
				
				if (this.legendNames == undefined){
					//define the color scale based on the unsorted data and the passed in color values.
					if (this.color == undefined){
					  this.color = d3.scale.ordinal().domain(keys).range(this.lineColors);
					}
					for (j=0; j<keys.length; j++){
						keyblob[keys[j]] = keys[j]
						keyblob[keys[j]+"raw"] = keys[j]
					}	
				}else{
				  	var colorDomain = []
				  	for (j=0; j<keys.length; j++){
						keyblob[keys[j]] = this.legendNames[keys[j]]
						keyblob[keys[j]+"raw"] = keys[j]					
						colorDomain.push(this.legendNames[keys[j]])
					}						
					if (this.color == undefined){
					  this.color = d3.scale.ordinal().domain(colorDomain).range(this.lineColors);
					}

				}
				
				_.each(keys, _.bind(function(key) {
			    	var newLine = new Line({name: keyblob[key], rawname:keyblob[key+"raw"], 

				    	values: new DataPoints(dataHolder.map(function(d) {
					   	 		var indexofD = dataHolder.indexOf(d)
					   	 		var indexofKey = keys.indexOf(key)
					   	 		y0 = 0;		    	
					   	 		stackTotal = 0;
					   	 		y0Stack = 0;
					   	 	for (counter=0; counter<keys.length; counter++){
						   	 	stackTotal = stackTotal + parseFloat(d[keys[counter]]);
					   	 	}
					   	 	if (indexofKey > 0){	
					   	 		for (counter = indexofKey; counter > 0; counter--){
					   	 				y0 = y0 + parseFloat(d[keys[counter-1]]);
					   	 				y0Stack = y0Stack + (parseFloat((d[keys[counter-1]]/stackTotal))*100)
					   	 		}
					   	 	}
					   	 	var theDate
			    			if (d.date == undefined){
				    			theDate = new Date();
			    			}else{theDate = self.parseDate(d.date) }
					   	 	
					   	 		return {name:keyblob[key], rawname:keyblob[key+"raw"], date: theDate, category:d.category, y0Total:y0, y1Total:y0 + parseFloat(d[key]), value:parseFloat(d[key]), stackTotal:stackTotal, y0Percent:y0Stack, y1Percent:y0Stack+((parseFloat(d[key])/stackTotal)*100), quarters:d.quarters, daterange:d.daterange, coalition:d.coalition};
				      		}),{parse:true}) 
			      					      		
			      		});
	
						totalChange = 0;
						newLine.get("values").each(function(currentItemInLoop){
							  var previousItem = newLine.get("values").at(newLine.get("values").indexOf(currentItemInLoop) - 1);

							  var firstItem = newLine.get("values").at(self.firstItemPosition);
							  var change;
							  if(previousItem){
								  change = currentItemInLoop.get('value') - previousItem.get('value');
								  totalChange += change;
								  percent = ((currentItemInLoop.get('value') / firstItem.get('value')) - 1)*100;
							  
								  currentItemInLoop.set({changePreMonth: change, CumulativeChange: totalChange, percentChange: percent});
							  }	else {
								  percent = ((currentItemInLoop.get('value') / firstItem.get('value')) - 1)*100;
								  	currentItemInLoop.set({changePreMonth: 0, CumulativeChange: 0, percentChange: percent})								  	
							  }
						  
							
						})
						
					
					
					//make this a loop to add each type straight to the model, and later to add it to each different type					

					var changeArray = ["rawValue","changePreMonth","CumulativeChange","percentChange"]
					for (index=0; index<changeArray.length; index++){
								
								window[changeArray[index]+"Line"] = new Line({name:keyblob[key], rawname:keyblob[key+"raw"], values: new DataPoints(
										dataHolder.map(function(d){
											var theDate
							    			if (d.date == undefined){
								    			theDate = new Date();
							    			}else{theDate = self.parseDate(d.date) }
											
											return {name:keyblob[key], rawname:keyblob[key+"raw"], date:theDate, category:d.category, type:d.type, value:parseFloat(d[key]), valueraw:parseFloat(d[key]), quarters:d.quarters, daterange:d.daterange};
										}),{parse:true}					
									)}
									);	
					
							CumulativeChange = 0;
							var changePreMonth =  [];
							var percentChange = [];
							var rawValue = [];

							window[changeArray[index]+"Line"].get("values").each(function(currentItemInLoop){
			  					  var previousItem = window[changeArray[index]+"Line"].get("values").at(window[changeArray[index]+"Line"].get("values").indexOf(currentItemInLoop) - 1);
			  					  var firstItem = window[changeArray[index]+"Line"].get("values").at(0);
									  if(previousItem){	  						  
			  						  rawValue = currentItemInLoop.get('valueraw');
			  						  changePreMonth = currentItemInLoop.get('valueraw') - previousItem.get('valueraw');
			  						  CumulativeChange += changePreMonth;
			  						  percentChange = ((currentItemInLoop.get('valueraw') / firstItem.get('valueraw')) - 1)*100;
			  					  
			  						  currentItemInLoop.set({value: eval(changeArray[index])});
			  					  }	else {
			  					   if(changeArray[index] == "rawValue"){return}
			  					  currentItemInLoop.set({value: 0})}	  				  	  					
			  				})
					
			  				this[changeArray[index]].add(eval(changeArray[index]+"Line"))
					}



					dataType = this.dataType;
					//add each line that we've made into the this data lines collection
			    	this[this.nestKeys[i]].add(newLine);
			    	this.data.add(newLine);
			    	
	
				}, this));
			
			}			
			
	},

	baseRender: function() {
		// create a variable called "self" to hold a reference to "this"
		var self = this;
		//d3.select(self.el)
		//	.style("position", "relative")
		//if it has multi-data, draw it the first time with the first data series
		if (self.hasMultiData=="yes"){
			self.data= self[self.multiDataLabels[self.multiDataLabels.length-1]];
		}
		if (self.changeChartLayout == "yes"){
			self.chartLayout = self.chartLayoutLables[self.chartLayoutLables.length-1]
		}
		//set the width and the height to be the width and height of the div the chart is rendered in
		this.width = this.$el.width() - self.margin.left - self.margin.right;
		this.height = this.$el.height() - self.margin.top - self.margin.bottom;
		//make a label based on the div's ID to use as unique identifiers 
		this.targetDiv = $(self.el).attr("id")
		//figure out if it has a timescale or an ordinal scale based on whether category is defined in the data
		this.hasTimeScale = function () {return self.data.models[0].get('values').models[0].get('category') == undefined}();		
		//set values if horizontal or not
		 self.switchX = "x"
		 self.switchY = "y"
		 self.switchLeft = "left" // change to top
		 self.switchHeight = "height" //change to width
		 self.switchWidth = "width"
		 self.switchTop = "top"
		
		if (self.horizontal == "yes"){
			 self.switchX = "y"
			 self.switchY = "x"
			 self.switchLeft = "top" // change to top
			 self.switchHeight = "width" //change to width	
			 self.switchWidth = "height"					
			 self.switchTop = "left"
		}
		//some aspects of the data useful for figuring out bar placement
		this.dataLength = self.data.models[0].get('values').models.length;
		this.numberOfObjects = function(){ 
			if (this.chartLayout == "onTopOf"){return 1}else{
				return self.data.models.length;
			}
		}
		self.widthOfBar = function(){
			if (this.chartLayout == "stackTotal" || this.chartLayout == "stackPercent"){
				return (self[self.switchWidth]/(self.dataLength))-(self[self.switchWidth]/(self.dataLength))*.2;
			}else{				
			 	return (self[self.switchWidth]/(self.dataLength*self.numberOfObjects()))-(self[self.switchWidth]/(self.dataLength*self.numberOfObjects()))*.2;
			}
		}
		      		   
		//create an SVG
		self.svg = d3.select(self.el).append("svg")
			.attr("width", self.width + self.margin.left + self.margin.right)
		    .attr("height", self.height +self. margin.top + self.margin.bottom)
		    .append("g")
		    .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");  
		        
		//make a rectangle so there is something to click on
		self.svg.append("svg:rect")
		    .attr("width", self.width)
		    .attr("height", self.height)
		    .attr("class", "plot");
		
		 //make a clip path for the graph  
		 var clip = self.svg.append("svg:clipPath")
		    .attr("id", "clip" + self.targetDiv)
		    .append("svg:rect")
		    .attr("x", -4)
		    .attr("y", -4)
		    .attr("width", self.width+58)
		    .attr("height", self.height+8);			        

		//go get the scales from the chart type view
	   	this.scales = {
        x: this.getXScale(),
        y: this.getYScale()
		};
	   
	    //put in the recessions, if there are any.
		if (self.hasRecessions == "yes"){
			var recessionDateParse = d3.time.format("%m/%d/%Y").parse;
			var recessionData = [{"recess":[{"start":"5/1/1937","end":"6/1/1938"},{"start":"2/1/1945","end":"10/1/1945"},{"start":"11/1/1948","end":"10/1/1949"},{"start":"7/1/1953","end":"5/1/1954"},{"start":"8/1/1957","end":"4/1/1958"},{"start":"4/1/1960","end":"2/1/1961"},{"start":"12/1/1969","end":"11/1/1970"},{"start":"11/1/1973","end":"3/1/1975"},{"start":"1/1/1980","end":"7/1/1980"},{"start":"7/1/1981","end":"11/1/1982"},{"start":"7/1/1990","end":"3/1/1991"},{"start":"3/1/2001","end":"11/1/2001"},{"start":"12/1/2007","end":"6/1/2009"}]}];	
			var recessions = self.svg.selectAll('.recession')
				.data (recessionData);
				
			var recessionsEnter = recessions.enter().append('g')
				.attr("clip-path", "url(#clip" + self.targetDiv + ")")
				.attr("class","recession")
				.attr("display", "block");
		
			recessions.selectAll("rect")
				.data( function(d) {return(d.recess);} )
				.enter()
				.append("rect")
				.attr("class", "recessionBox")
				.attr("x", function (d) {  return self.scales.x(recessionDateParse(d.start))})
				.attr("y", 0)
				.attr("width", function (d) {return (self.scales.x(recessionDateParse(d.end))) - (self.scales.x(recessionDateParse(d.start)))})
				.attr("height",self.height);
		}			


						
		//currently quite sloppy method for line that moves with cursor
		var baseElement = document.getElementById(self.targetDiv);
		// Find your root SVG element
		var svgFind = baseElement.querySelector('svg');		
		// Create an SVGPoint for future math
		var pt = svgFind.createSVGPoint();
		
		// Get point in global SVG space
		function cursorPoint(evt){
		  pt.x = evt.clientX; pt.y = evt.clientY;
		  return pt.matrixTransform(svgFind.getScreenCTM().inverse());
		}
		
		var cursor = 0-self.margin[self.switchLeft]-10;
		//add a line	
		self.svg.append('svg:line')
			.attr('class','cursorline')
			.attr("clip-path", "url(#clip" + self.targetDiv + ")")
			.attr(self.switchX+'1', cursor)
			.attr(self.switchX+'2', cursor)
			.attr(self.switchY+'1',0)
			.attr(self.switchY+'2',self[self.switchHeight]);	

			
		
		if (self.makeTip == undefined){
			self.makeTip = function (theIndex, theData){
				var tip = "<div class='dateTip'>" + theData[0].get("values").models[theIndex].get("category") + "</div><hr class='legendhr'>"
				if (self.hasTimeScale==true){
					tip = "<div class='dateTip'>" + self.dateFormat(theData[0].get("values").models[theIndex].get("date")) + "</div><hr class='legendhr'>"				
				}				
				theData.forEach(function(d){
					var thisItem = d.get("values").models[theIndex]
					tip += "<div class='tipGroup'><div class='tipLine' style='background-color:"+self.color(thisItem.get("name"))+";'></div><div class='nameTip'>" + thisItem.get("name") + "</div><div class='valueTip'>" + self.dataLabels[0] + self.numbFormat(thisItem.get(self.dataType)) + " " + self.dataLabels[1] + "</div></div>"				
				})						
				return tip
			}
		}

			
		// tooltip divs
		self.tooltip = d3.select("#" + self.targetDiv).append("div")
			.attr("class", "tooltip")
            .style("opacity", 0)
            .classed("wider", function(d){
	            if (self.data.models.length >3){return true}else{return false}
            })
            .style("display","none")
            
        if (self.showTip =="yes" || self.hasLegend =="no"){
	        self.tooltip.style("display", "block")
        }
		
		var closestHolder;
		//move the line with the mouse	
		var svgmove = svgFind.addEventListener('mousemove',function(evt){

		  self.makeLegends.style("display","block")
		  var loc = cursorPoint(evt);
			cursor = loc[self.switchX];
			yPoint = loc[self.switchY]
			
			var widthsOver = 0
			if (self.chartLayout == "sideBySide"){
				var eachChartWidth = (self.width/self.numberOfObjects())
				for (i=0; i<self.data.models.length; i++ ){
					if ((cursor-self.margin.left) > eachChartWidth){
						cursor = cursor-eachChartWidth
						widthsOver = widthsOver+eachChartWidth;
					}
				}
			}
		 var toolTipModifier = 0;
		  
			if (self.hasTimeScale==true){
				var locationDate = self.scales.x.invert(cursor-self.margin[self.switchLeft]);
				var closest = null;
				
				self.data.models[0].get("values").models.forEach(function(d,i){
					if (closest == null || Math.abs(d.get("date")-locationDate)<Math.abs(closest - locationDate)){
						closest = d.get("date")
						self.tooltipIndex = i;
					}
			
				})					
			}else{
				var closestIndexValue = null;
				var indexLocation = cursor - parseFloat(self.margin[self.switchLeft])
				self.scales.x.range().forEach(function(d){
					if (closestIndexValue == null || Math.abs(d-indexLocation)<Math.abs(closestIndexValue - indexLocation)){
						closestIndexValue = d
					}					
				})
				closestIndex = self.scales.x.range().indexOf(closestIndexValue)
				self.tooltipIndex = closestIndex;
				closest = self.scales.x.domain()[closestIndex]
				toolTipModifier = self.widthOfBar()/2
			}

			if (closest != closestHolder){
				closestHolder=closest;
				var parseDate = d3.time.format("%m/%d/%Y").parse
				var formatDate = d3.time.format("%m/%d/%Y");
				var circlesGoBoom = d3.selectAll ("#reutersGraphicMap .circle")
					.sort(function(a,b){
				      	if (formatDate(parseDate(a.date))==formatDate(closest)){
					      	return -1
				      	}else{return 1}
		      		})
		      		
					circlesGoBoom.transition()
					.duration(500)
					.delay(function(d, i) { return  (i *10); })
					.attr ("r", function (d) {
						var thisOne = this;
						if ($(this).attr("r") != 0){
							if ($(this).attr("r") == Math.sqrt(d.plot/Math.PI)*10 ){return 0}else{ return Math.sqrt(d.plot/Math.PI)*10}							
						}else{
							if (formatDate(parseDate(d.date)) == formatDate(closest)) {
								return Math.sqrt(d.plot/Math.PI)*10;
							}else {return 0}														
						}
						
					})
					.each("end", function(d){
						d3.select(this)
							.attr ("r", function (d) {
								if (formatDate(parseDate(d.date)) == formatDate(closest)) {
									return Math.sqrt(d.plot/Math.PI)*10;
								}else {return 0}
							})	
						
						
					})				
			}
				
			
			//just do it on one line? or all lines?
			d3.selectAll("#" + self.targetDiv + " .cursorline")
				.attr(self.switchX+'1', (self.scales.x(closest)+toolTipModifier + widthsOver ))
				.attr(self.switchX+'2', self.scales.x(closest)+toolTipModifier + widthsOver);

				self.tooltip
					.html(function(d){
						return self.makeTip(self.tooltipIndex, self.data.models)
					})				
	        		.style("opacity", .9)
					.style(self.switchLeft, function(d){
						var tipWidth = $("#" + self.targetDiv + " .tooltip").width()
						if (cursor < (self.margin.left + self.width +self.margin.right)/2){
							return self.margin[self.switchLeft]+self.scales.x(closest)+toolTipModifier+15+"px"
						}else{
							return self.scales.x(closest)+toolTipModifier-tipWidth+"px"
							
						}						
					})
					.style(self.switchTop, function(d){
						if (yPoint > (self.margin.top+self.height+self.margin.bottom)*2/3){
							return yPoint-105 + "px"
						}else {return yPoint+35 + "px"}
					})						
		
			if (self.hasLegend == "yes"){

				if ( isNaN(self.data.models[0].get("values").models[self.tooltipIndex].get(self.dataType)) == true){
					self.makeLegends.style("display","none");
					return;
				}

				self.legendValue
					.data(self.data.models, function(d) {return(d.get('name'));})
					.html(function(d,i){
						return self.dataLabels[0] + self.numbFormat(self.data.models[i].get("values").models[self.tooltipIndex].get(self.dataType)) + " " + self.dataLabels[1]
					})	
				self.legendDate.html(function(){
					if (self.hasTimeScale == true){
						if (self.data.models[0].get("values").models[self.tooltipIndex].get("daterange") !== null){
						return self.data.models[0].get("values").models[self.tooltipIndex].get("daterange"); 
						}
						return self.dateFormat(self.data.models[0].get("values").models[self.tooltipIndex].get("date"));
					}else{
					return self.data.models[0].get("values").models[self.tooltipIndex].get("category")
					}	
				})
				self.setLegendPositions()	

				if (cursor > self.width+self.margin.left){
				    self.legendValue.html("")
				    self.legendDate.html("")					
					self.setLegendPositions()
				}
			}
		
		},false);
		
		
		var svgout = svgFind.addEventListener('mouseout',function(evt){
			
			d3.selectAll ("#reutersGraphicMap .circle")
				.attr ("r", 0)
			
			self.makeLegends.style("display","none")
			d3.selectAll("#" + self.targetDiv + " .cursorline")
				.attr(self.switchX+'1', 0-self.margin[self.switchLeft]-10 )
				.attr(self.switchX+'2', 0-self.margin[self.switchLeft]-10);
				
				self.tooltip
        		.style("opacity", 0)
        		
        		if (self.hasLegend=="yes"){
	        		self.legendValue.html("")
				    self.legendDate.html("")
					self.setLegendPositions()
				}
		},false);

    
		//create and draw the x axis
		self.xAxis = d3.svg.axis()
	    	.scale(self.scales[self.switchX])
		    .orient("bottom")
		    .tickPadding(8)
		    .ticks(self.xScaleTicks)
		    .tickFormat(function (d){
			    var dateFormat = d3.time.format("%b");
				return dateFormat(d);
			});
		    
		if (self.horizontal == "yes"){
			self.xAxis.tickSize(0-self.height)
		}

		if (self.xTickFormat != undefined){
			datedomain = []
			for(i=0; i < self.data.models[0].get('values').models.length; i++){				
				datedomain[i] = self.data.models[0].get('values').models[i].get('date')	
			}
			self.xAxis.tickFormat(self.xTickFormat).tickValues(datedomain);
		}			
		//create and draw the y axis                  
		self.yAxis = d3.svg.axis()
	    	.scale(self.scales[self.switchY])
		    .orient("left")
		    .ticks(self.yScaleTicks)
		    .tickPadding(8)


			
		if (self.yTickFormat != undefined){
			self.yAxis.tickFormat(self.yTickFormat);
		}
		if (self.horizontal != "yes"){
			self.yAxis.tickSize(0-self.width)
		}else{
			self.yAxis.tickSize(0)
		}		 

		  			
		//if autoScale ing then setup the auto scale.  hasZoom and multiData automatically get auto-scaling
		if (self.autoScale == "yes" || self.hasZoom == "yes"){	
		}else{	
			//otherwise setup the manual ticks.						
			self[self.switchY+"Axis"].tickValues(self.yScaleVals)
		}
	

	//put in the legend
	if (self.hasLegend =="yes"){
		

		self.makeLegends = d3.select(self.el).append("div")
			.attr("class", "legendContainer")
//			.style("width", (self.margin.right-15)+"px")
//			.style("top", self.margin.top+"px")
		
		self.legendDate = self.makeLegends.append("div").attr("class", "legendDate")
		
		self.makeLegends.append("hr").attr("class", "legendhr")
		
		self.legendItems = self.makeLegends.selectAll('.legendItem')
			.data(self.data.models, function(d) {return(d.get('name'));})
			.enter()
			.append("div")
			.attr("class", "legendItems")
			.attr("id", function(d){
				return self.targetDiv+d.get('name');								
			})
			.on("click", function(d){
				if (d3.select(this).classed("clicked") != true){
					d3.select(this)
						.classed("clicked", true)
				}else{
					d3.select(this)
						.classed("clicked", false)
				}					
				var removeArray = []
				self.legendItems.each(function(d,i){
					  if($(this).hasClass('clicked')){
			            removeArray.push(d.get("rawname"))
			         } 							
				})				
				self.legendData = []											
				self.rawData.forEach(function(d,i){
					self.legendData[i]= _.omit(d,removeArray)
				})
				self.dataParse(self.legendData);

				if (self.hasMultiData == "yes"){
					d3.selectAll("#" + self.targetDiv + " .navButtons").each(function(d,i){
						var thisEl = this
						if(d3.select(thisEl).classed("selected")==true){
							self.data= self[$(thisEl).attr("dataid")]	 				 													
						} 								
					})					
				}
				self.update ();  		
			})		
			
		self.legendItems
			.append("div")
			.attr("class", "legendLines")
			.style("background-color", function(d){
				 return self.color(d.get('name'));
			})
			.style("width", (self.margin.right-15)/2+"px")
		self.legendItems
			.append("div")
			.attr("class", "legendText")
			.html(function(d){
				return d.get("name")
			})
		
		self.legendValue = self.legendItems
			.append("div")
			.attr("class", "legendValue")
		

		
		self.setLegendPositions = function(){
			var depth = 0;						
			self.legendItems
				.data(self.data.models, function(d) {return(d.get('name'));})
				.style("margin-top", function(d,i){					
						var returnDepth = depth;
						var w = window.innerWidth;
						if (w <600){depth += $(this).height()}else{
							depth += $(this).height()+10							
						}
						return returnDepth+"px";	
				})						
			self.legendItems
				.data(self.data.models, function(d) {return(d.get('name'));})
				.exit()
				.style("margin-top", function(d,i){					
						var returnDepth = depth;
						depth += $(this).height()+10
						return returnDepth+"px";	
				})	

		}
		self.setLegendPositions()
	}
	
    // if multi-data, will need labels to click on
    if (self.hasMultiData == "yes"){

		self.makeNav = d3.select(self.el).append("div")
			.attr("class", "navContainer")
			.style("width", (self.margin.width)+"px")
		
		self.makeNavButtons = self.makeNav.selectAll('.navButtons')
			.data(self.multiDataLabels)
			.enter()
			.append("div")
			.attr("class", "navButtons")
			.attr("dataid", function(d){
				return d
			})
			.html(function(d,i){
				return self.multiDataLabelsDisplay[i]
			})
			.classed("selected", function(d,i){
				if (i == self.multiDataLabels.length-1){
					return true
				}else{return false}
			})
            .on("click", function(d,i) {
				if (self.YTickLabel[i]==undefined){
					self.dataLabels = self.YTickLabel[0]
				}else{self.dataLabels = self.YTickLabel[i]}

				if ($(this).hasClass("selected")){
					return
				}
				var thisID = $(this).attr("dataid");
				$(this).addClass("selected").siblings().removeClass("selected")
				
//							if(this.id == "value" || this.id == "changePreMonth" || this.id == "CumulativeChange" || this.id == "percentChange"){
//								self.dataType = this.id;
//								self.update()
//							}
    		    self.data= self[thisID] 
		    	self.update ();									
											
	        })
	        
			self.navheights = []
			self.makeNavButtons
				.each( function(d,i){
					self.navheights.push($(this).height())
				})
				.style("height", d3.max(self.navheights)+"px")


	}

    // if multi-data, will need labels to click on
    if (self.changeChartLayout == "yes"){

		self.makeNavLayout = d3.select(self.el).append("div")
			.attr("class", "layoutNavContainer")
			.style("width", (self.margin.width)+"px")
		
		self.makeNavLayoutButtons = self.makeNavLayout.selectAll('.layoutNavButtons')
			.data(self.chartLayoutLables)
			.enter()
			.append("div")
			.attr("class", "layoutNavButtons")
			.attr("dataid", function(d){
				return d
			})
			.html(function(d,i){
				return self.chartLayoutLablesDisplay[i]
			})
			.classed("selected", function(d,i){
				if (i == self.chartLayoutLablesDisplay.length-1){
					return true
				}else{return false}
			})
            .on("click", function(d,i) {
				if (self.YTickLabel[i]==undefined){
					self.dataLabels = self.YTickLabel[0]
				}else{self.dataLabels = self.YTickLabel[i]}

				if ($(this).hasClass("selected")){
					return
				}
				var thisID = $(this).attr("dataid");
				$(this).addClass("selected").siblings().removeClass("selected")
				
//							if(this.id == "value" || this.id == "changePreMonth" || this.id == "CumulativeChange" || this.id == "percentChange"){
//								self.dataType = this.id;
//								self.update()
//							}
    		    self.chartLayout= d 
		    	self.update ();									
											
	        })
	}
	
	//end of chart render			
	return this;

	}

});


