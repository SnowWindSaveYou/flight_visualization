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


var arrowMarker = (layout,id,fill,stroke)=>{
    arrow = layout.append("marker")
    .attr("id",id)
    .attr("markerUnits","strokeWidth")
    .attr("markerWidth","12")
    .attr("markerHeight","12")
    .attr("viewBox","0 0 12 12") 
    .attr("refX","6")
    .attr("refY","6")
    .attr("orient","auto");
    x = 5
    // var arrow_path = "M2,2 L10,6 L2,10 L6,6 L2,2";
    var arrow_path = "M"+x+","+x+
                    " L"+(8+x)+",6"+
                    " L"+x+",10"+
                    " L"+(x+4)+",6"+
                    " L"+x+","+x
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

getAngle= (x1,x2,y1,y2)=>{
    dx = y1-x1
    dy = y2-x2
    angle = Math.abs(Math.atan2(dy,dx)*90/Math.PI)
    if(dx>=0& dy>=0){
        // console.log("q1 "+dx+","+dy)
        return angle}
    else if (dx>=0& dy<=0) { 
        // console.log("q2 "+dx+","+dy) 
        return 360 - angle} 
    else if (dx<=0& dy<=0) { 
        console.log("q3 "+dx+","+dy+", "+angle) 
        return 180 + angle} 
    else {
        // console.log("q4 "+dx+","+dy+", "+angle) 
        return 180 - angle}
}

create_airline=(from_pos, to_pos, from_name, to_name, properties)=>{
    
    var arr_id = "arr_from_"+repSpace(from_name)+'_to_'+repSpace(to_name);
    arrowMarker(map,
        arr_id,
        engine_list.get(properties.engine),
        aircraft_list.get(properties.aircraft))
    var from_str = 'M'+from_pos[0]+' '+from_pos[1]
    // to_str = ' '+to_pos[0]+' '+to_pos[1]
    // r = Math.ceil(Math.random()*5)+5;  
    var r = Math.ceil(Math.sqrt(Math.pow(from_pos[0]-to_pos[0],2)+Math.pow(from_pos[1]-to_pos[1],2))/100)
    var mid_pos = [(((from_pos[0]+to_pos[0])/2) +r),(((from_pos[1]+to_pos[1])/2 )-r)]
    // mid_str = 'Q'+mid_pos[0]+' '+mid_pos[1]
    var to_str = 'T'+to_pos[0]+' '+to_pos[1]
    var mid_str = 'T'+mid_pos[0]+' '+mid_pos[1]

    var quadrant = 0;
    var angle = getAngle(from_pos[0],from_pos[1],to_pos[0],to_pos[1])

    console.log(arr_id+": "+angle)

    // draw the flight animation 
    flight = map
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
            // console.log(angle)
            d3.active(this)
                .attr("transform", "translate("+from_pos[0]+","+from_pos[1]+"),rotate("+angle+")")
                .duration(0)
                .transition()
                .attr("transform", "translate("+to_pos[0]+","+to_pos[1]+"),rotate("+angle+")")
                .duration(Math.random()*500+1000)
                .transition()
                .delay(200)
                .on("start", repeat);
          });
    // draw the path of flight line
    map.append('path')
        .classed('airline', true)
        .classed('from_'+repSpace(from_name), true)
        .classed('to_'+repSpace(to_name), true)
        .classed('airspace_'+repSpace(properties.airspace), true)
        .classed('aircraft_'+repSpace(properties.aircraft), true)
        .classed('engine_'+repSpace(properties.engine), true)
        .attr('stroke-dasharray', stroke_style[properties.airspace])
        .attr('stroke', ()=>{
            return toRGB(properties.price)
        })
        .attr('stroke-width', '1')
        .attr('fill', 'none')
        .attr('d', from_str+mid_str+to_str)
        .attr("marker-mid",()=>{
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
        .attr('r', 3)
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
    .text("Engine Model:");
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
}


// exe data loaders together
Promise.all([load_citeis(),load_lines(),load_map()]).then(()=>{
    console.log("data load complited")
    var city_color = color(strongcolor)
    // draw air lines
    lines_sum.forEach((tocity,city)=>{
        var from_pos = projection([cities_pos.get(city)[0],cities_pos.get(city)[1]])
        var mycolor = city_color(Math.ceil(Math.random()*strongcolor.length))+"AA"
        // crate city node
        map.append("circle")
        .attr("r",tocity.size*5)
        .attr("stroke","#ffffffaa")
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
            "<li><label class= 'cblabel'  style='background:"+mycolor +"'><input class='from_city_checkbox' id='from_"+city+"_checkbox' type='checkbox'  checked='true' value='from_"+city+"' name='city'/>"
            +city
            +"</label></li>"
        );
        $("#to_city_list").append(
            "<li><label class='cblabel' style='background:"+mycolor +"'><input class='to_city_checkbox' id='to_"+city+"_checkbox' type='checkbox' value='to_"+city+"' name='city'/>"
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

        tocity.forEach((attr,name)=>{
            var to_pos = projection([cities_pos.get(name)[0], cities_pos.get(name)[1]])
            // create airline
            create_airline(from_pos,to_pos,city,name,attr)
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