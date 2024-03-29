//Width and height
var w = 850;
var h = 700;

var selected = []

//Define map projection
var projection = d3.geoMercator()
    .center([132, -28])
    .scale(850)
    .translate([w / 2, h / 2]);

//Define path generator
var path = d3.geoPath()
    .projection(projection);


stroke_style={"A":"30 2","B":"10,5,2,2,2,5","C":"4 8 4 4 8","D":"2 4","E":"1 5 1"}

softcolor = ["#aac8d0","#46fffb","#c9bbc8","#e7c1ce","#f4dcd0","#c9f1cb"]
strongcolor = ['#9fffa9', "#c1d5e7",'#f74964', '#fbd248', '#fd614b', '#c1afff', '#4db5ae', '#a02b3d', '#ccd56a', '#ee4264']
bluecolor = ["#ff00d1","#b700ff","#7000ff","#0005fa","#009eff","#00e5ff","#14bdc7","#9f99f4"]
var color =(colorset)=> d3.scaleOrdinal().range(colorset);

// int value to rgb 
var toRGB = (val,max=255)=>{
    half = max/2
    one = 255/half
    r = 0
    g = 0
    b = 0
    if(val<max/2){
        r = one * val;  
        g = 255;
    }else{
        g = (255 - ((val - half) * one)) < 0 ? 0 : (255 - ((val - half) * one))
        r = 255;
    }
    return "rgb(" + r + "," + g + "," + b + ")";
}

// replace space to _ for constrain names have space
var repSpace = (text)=>{
    return text.replace(" ","_")
}


// define zooming function
var zoom = d3.zoom().scaleExtent([0.5, 10]).on("zoom", ()=>{
    // console.log(d3.event.transform) 
    map.attr("transform","translate(" + d3.event.transform.x +","+d3.event.transform.y+ ")scale(" + d3.event.transform.k + ")");

})

//Create SVG container
var svg = d3.select("#aust_map")
    .append("svg")
    .attr("id","map")
    .attr("width", w)
    .attr("height", h)
    .call(zoom);
// map svg
var map = svg.append("g")


var arrowMarker = (layout,id,fill,stroke,refx)=>{
    arrow = layout.append("marker")
    .attr("id",id)
    .attr("markerUnits","strokeWidth")
    .attr("markerWidth","12")
    .attr("markerHeight","12")
    .attr("viewBox","0 0 12 12") 
    .attr("refX",refx)
    .attr("refY","6")
    .attr("orient","auto"); 
    // var arrow_path = "M2,2 L10,6 L2,10 L6,6 L2,2";
    var arrow_path = "M2,4 L10,6 L2,8 L6,6 L2,4";
    arrow.append("path")
        .attr("d",arrow_path)
        .attr('stroke-width', 0.7)
        .attr("stroke", stroke)
        .attr("fill",fill);
}



// load cities data
cities_pos = new Map()
load_citeis = () => d3.json("./flight_visual/data/au.json").then( function (json) {
    for(city of json){
        cities_pos.set(city.city,[city.lng,city.lat])
    }

});


// load flight lines data, at same time collect aircraft and engine list
lines_sum = new Map()
aircraft_list = new Map()
engine_list = new Map()
load_lines = () => d3.json("./flight_visual/data/flights_data.json").then( function (json) {
    colorset = color(strongcolor)
    for(line of json.flights){
        if(!lines_sum.has(line.From_City)){
            lines_sum.set(line.From_City, new Map())
        }
        if(!aircraft_list.has(line.Aircraft_Model)){
            aircraft_list.set(line.Aircraft_Model,colorset(aircraft_list.size))
        }
        if(!engine_list.has(line.Engine_Model)){
            engine_list.set(line.Engine_Model, colorset(engine_list.size))
        }
        lines_sum.get(line.From_City).set(line.To_City,{
            "airspace":line.AirSpace_Class,"price":line.Price, "aircraft":line.Aircraft_Model,"engine":line.Engine_Model
        })
    }
    console.log(lines_sum)
});

// Load in GeoJSON data
load_map = () => d3.json("./flight_visual/data/aust.json").then( function (json) {
        var map_color = color(softcolor)
        // Bind data and create one path per GeoJSON feature
        map.selectAll("path")
            .data(json.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("stroke", "#FFF")
            .attr("fill", "#c3bdb4");
        //States
        map.selectAll("text")
        .data(json.features)
        .enter()
        .append("text")
        .attr("fill", "#ffffff55")
        .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .text(function(d) {
            return d.properties.STATE_NAME;
        });
});

getAngle= (x1,y1,x2,y2)=>{
    var dx = x2-x1
    var dy = y2-y1
    var angle = Math.abs(Math.atan2(dy,dx)*180/Math.PI)
    if(y2>=y1){return angle} 
    else {return  -angle}
};

 getVer = (x1,y1,x2,y2,positive)=>{
    var dx = x2-x1
    var dy = y2-y1
    var mx = (x1+x2)/2
    var my = (y1+y2)/2
    var b = my + (dx/dy)*mx
    var dist = Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2))
    if(dist<50){dist = 50}
    else if(dist>200){dist = 200}
    var rx,cx = 0
    var r = Math.ceil((Math.random()*100+500)/(dist))

    var angle = Math.atan(-dx/dy)
    r = Math.cos(angle)*r
    var rx,cx = 0
    if(positive){
        rx = mx + r
        cx = mx + (r/2)
    }else{
        rx = mx - r
        cx = mx - (r/2)
    }

    var ry = -(dx/dy)*rx +b
    var cy = -(dx/dy)*cx +b
    return [rx,ry,cx,cy,dist]
}

 create_airline=(layer,from_pos, to_pos, from_name, to_name, properties)=>{
    var priceRGB = toRGB(properties.price)
    var arr_id = "arr_from_"+repSpace(from_name)+'_to_'+repSpace(to_name);
    arrowMarker(map,arr_id, priceRGB,priceRGB,20)
    // var mid_pos = [(from_pos[0]+to_pos[0])/2,(from_pos[1]+to_pos[1])/2 ]
    var angle = getAngle(from_pos[0],from_pos[1],to_pos[0],to_pos[1])
    var vertex = getVer(from_pos[0],from_pos[1],to_pos[0],to_pos[1],angle>0)
    var dist = vertex[4]
    var from_str = 'M'+from_pos[0]+' '+from_pos[1]
    var mid_str = 'Q'+(vertex[0])+' '+(vertex[1])
    var to_str = ' '+to_pos[0]+' '+to_pos[1]
    // draw the flight animation 
    flight = layer
        // .append("circle")
        .append("path")
        .attr("d","M2,-4 L10,0 L2,4 L6,0 L2,-4")
        .classed('airline', true)
        .classed('from_'+repSpace(from_name), true)
        .classed('to_'+repSpace(to_name), true)
        .classed('airspace_'+repSpace(properties.airspace), true)
        .classed('aircraft_'+repSpace(properties.aircraft), true)
        .classed('engine_'+repSpace(properties.engine), true)
        .attr('r',3)
        .attr('stroke-width', 1)
        .attr("stroke", aircraft_list.get(properties.aircraft))
        .attr('fill', engine_list.get(properties.engine))
        .attr("transform", "translate("+from_pos[0]+","+from_pos[1]+"),rotate("+angle+")")
        .transition()
        .attr("transform", "translate("+to_pos[0]+","+to_pos[1]+")")
        .ease(d3.easeLinear)
        .duration(Math.random()*500+1000)
        .delay(100)
        .on("start", function repeat() {
            d3.active(this)
                .attr("transform", "translate("+from_pos[0]+","+from_pos[1]+"),rotate("+angle+")")
                .duration(0)
                .transition()
                .attr("transform", "translate("+vertex[2]+","+vertex[3]+"),rotate("+angle+")")
                .duration(dist*10)
                .transition()
                .attr("transform", "translate("+to_pos[0]+","+to_pos[1]+"),rotate("+angle+")")
                .duration(dist*10)
                .transition()
                .delay(200)
                .on("start", repeat);
          });
    // draw the path of flight line

    layer.append('path')
        .classed('airline', true)
        .classed('from_'+repSpace(from_name), true)
        .classed('to_'+repSpace(to_name), true)
        .classed('airspace_'+repSpace(properties.airspace), true)
        .classed('aircraft_'+repSpace(properties.aircraft), true)
        .classed('engine_'+repSpace(properties.engine), true)
        .attr('stroke-dasharray', stroke_style[properties.airspace])
        .attr('stroke', priceRGB)
        .attr('stroke-width', 1)
        .attr('fill', 'none')
        .attr('d', from_str+mid_str+to_str)
        .attr("marker-end",()=>{
            return "url(#"+arr_id+")"
        });

}

list_attr_meta=()=>{
    var box = svg.append("g").attr("class","label")
    var y = 15
    var x = 5
    var k = 20

    var airspace_g = box.append("g")
    airspace_g.append('text')
    .attr("fill", "#DDD")
    .attr("transform", "translate(" + (x)+"," +y+ ")")
    .attr("dy", ".35em")
    .text("AirSpace Classes:");
    y+=k
    for(stroke in stroke_style ){
        airspace_g.append('path')
        .attr('stroke-dasharray', stroke_style[stroke])
        .attr('stroke', "#DDD")
        .attr('stroke-width', '1')
        .attr('fill', 'none')
        .attr('d', "M"+(x+15) +" "+y+"L"+(x+100)+" "+y );

        airspace_g.append('text')
        .attr("fill", "#DDD")
        .attr("transform", "translate(" + (x)+"," +y+ ")")
        .attr("dy", ".35em")
        .text(stroke);
        y+=k
    }

    y= 160
    aircraft_g = box.append("g")
    aircraft_g.append('text')
    .attr("fill", "#DDD")
    .attr("transform", "translate(" + (x)+"," +y+ ")")
    .attr("dy", ".35em")
    .text("Aircraft Models:");
    y+=k
    aircraft_list.forEach((colorid,aircraft)=>{
        aircraft_g.append('circle')
        .attr('r', 4.5)
        .attr('stroke-width', 2)
        .attr('stroke', colorid)
        .attr('fill', "none")
        .attr("transform", "translate(" + (x+5)+"," +y+ ")");

        aircraft_g.append('text')
        .attr("fill", "#DDD")
        .attr("transform", "translate(" + (x+15)+"," +y+ ")")
        .attr("dy", ".35em")
        .text(aircraft);
        y+=k
    })

    y=360
    aircraft_g = box.append("g")
    aircraft_g.append('text')
    .attr("fill", "#DDD")
    .attr("transform", "translate(" + (x)+"," +y+ ")")
    .attr("dy", ".35em")
    .text("Engine Models:");
    y+=k
    engine_list.forEach((colorid,engine)=>{
        aircraft_g.append('circle')
        .attr('r', 6)
        .attr('fill', colorid)
        .attr("transform", "translate(" + (x+5)+"," +y+ ")");

        aircraft_g.append('text')
        .attr("fill", "#DDD")
        .attr("transform", "translate(" + (x+15)+"," +y+ ")")
        .attr("dy", ".35em")
        .text(engine);
        y+=k
    })

    y = 600
    price_g = box.append("g")
    price_g.append('text')
    .attr("fill", "#DDD")
    .attr("transform", "translate(" + (x)+"," +y+ ")")
    .attr("dy", ".35em")
    .text("Price:");
    y+=10
    x+=5
    var i = 0
    for(var i = 0;i<=250;i+=10){
        price_g.append('path')
        .attr('stroke', toRGB(i) )
        .attr('stroke-width', 3)
        .attr('fill', 'none')
        .attr('d', "M"+x +" "+y+"L"+x+" "+(y+10 ));
        
        if(i%50==0){
            price_g.append('text')
            .attr("font-size", 9)
            .attr("fill", "#DDD")
            .attr("transform", "translate(" + (x)+"," +(y+15)+ ")")
            .attr("dy", ".35em")
            .text(i);  
        }
        x+=10
    }
}


// exe data loaders together
Promise.all([load_citeis(),load_lines(),load_map()]).then(()=>{
    console.log("data load complited")
    var city_color = color(strongcolor)

    // draw air lines
    lines_sum.forEach((tocity,city)=>{
        var from_pos = projection([cities_pos.get(city)[0],cities_pos.get(city)[1]])
        var mycolor = city_color(Math.ceil(Math.random()*strongcolor.length))+"AA"
        var alph = 33
        if(tocity.size<=2){alph="ff"}
        // crate city node
        map.append("circle")
        .attr("r",tocity.size*5)
        .attr("stroke","#ffffff"+alph)
        .attr("fill", mycolor)
        .attr("class",(d)=>{
            return "node_"+repSpace(city)
        })
        .attr("transform",(d)=>{
            return "translate("+from_pos[0]+","+from_pos[1]+")"
        })
        .on("click",function(d,i){
            if($("#from_"+city+"_checkbox").is(':checked')){
                $("#from_"+city+"_checkbox").removeAttr("checked"); 
            }else{
                $("#from_"+city+"_checkbox").prop("checked",true)
            }
            updateHidden()
        })  

        // insert city selection check boxes
        $("#from_city_list").append(
            "<li><label class= 'cblabel'  style='background:"+mycolor +"'><input class='from_city_checkbox' id='from_"+repSpace(city)+"_checkbox' type='checkbox'  checked='true' value='from_"+repSpace(city)+"' name='city'/>"
            +city
            +"</label></li>"
        );
        $("#to_city_list").append(
            "<li><label class='cblabel' style='background:"+mycolor +"'><input class='to_city_checkbox' id='to_"+repSpace(city)+"_checkbox' type='checkbox' value='to_"+repSpace(city)+"' name='city'/>"
            +city
            +"</label></li>"
        );

        // crate city label
        map.append("text")
        .attr("font-size",tocity.size*3)
        .attr("fill", "#fff")
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .attr("class",(d)=>{
            return "label_"+repSpace(city)
        })
        .attr("transform",(d)=>{
            return "translate("+from_pos[0]+","+from_pos[1]+")"
        }).text(function(d) {
            return city;
        });

        var airlinegraph = map.append('g')
        tocity.forEach((attr,name)=>{
            var to_pos = projection([cities_pos.get(name)[0], cities_pos.get(name)[1]])
            // create airline
            create_airline(airlinegraph,from_pos,to_pos,city,name,attr)
        })

        
    })
    list_attr_meta()

    // selection action
    $(':input').change(function(a) { 
        updateHidden()
    });
})

updateHidden=()=>{
    d3.selectAll(".airline").attr("style","visibility: hidden"); 
    $(':input:checked').each(function(){
        d3.selectAll("."+$(this).val()).attr("style","visibility: visible"); 
    });

}

cancelFrom =()=>{
    $(".from_city_list,input").removeAttr("checked"); 
    updateHidden()
}
cancelTo =()=>{
    $(".to_city_list,input").removeAttr("checked"); 
    updateHidden()
}