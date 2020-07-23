var express=require('express');
var path=require('path');
var session=require('express-session');
var ejs=require('ejs');
const bodyParser=require('body-parser');
var app=express();
var mongoose=require('mongoose');
var flash=require('req-flash');
var uniqueValidator=require('mongoose-unique-validator');
var nodemailer=require('nodemailer');
var mongoDB='mongodb://localhost/homeservice';
app.set('views',path.join(__dirname,'Views'));
app.set('view engine','ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(session({ secret: '123' }));
app.use(flash());
require('dotenv').config()

mongoose.connect(mongoDB);
mongoose.connection.on('error', (err) => {
    console.log('DB connection Error');
});
mongoose.connection.on('connected', (err) => {
    console.log('DB connected');
});

var feedbackSchema=new mongoose.Schema({
  bookid:String,
  overRating:Number,
  proRating:Number,
  timeRating:Number,
  serviceRating:Number,
  headline:String,
  review:String
});
feedbackSchema.plugin(uniqueValidator);
var feedbacks =  mongoose.model('feedbacks',  feedbackSchema);

app.post('/feed',function (req, res)
{
  let newfeed = new feedbacks
  ({
    bookid:req.body.bookid,
    overRating:req.body.sel,
    proRating:req.body.sel1,
    timeRating:req.body.sel2,
    serviceRating:req.body.sel3,
    headline:req.body.sub,
    review:req.body.desp
  })
  newfeed.save().then
  (data =>{
    console.log(data);
    res.send(data);
  }).catch(err =>{
    res.send(err);
  })
});

app.post('/checkar',function (req, res)
{
	feedbacks.find({
    "bookid":req.body.bookid
	})
  .then(data => {
    if(data.length==0)
      res.send("not");
    else
      res.send("rev");
  })
  .catch(err => {
    res.send(error)
  })
});

app.post('/checkrev',function (req, res)
{
	users.find({
    "_id":req.body.bookid
	})
  .then(data => {
    bookings.find({
      "email":data[0].email
    })
    .then(data1 => {
      console.log(data1);
      res.send(data1);
    })
    .catch(err => {
      res.send(error)
    })
    //res.send(data);
  })
  .catch(err => {
    res.send(error)
  })
});

app.post('/getfeed',function (req, res)
{
	feedbacks.find({
    "bookid":req.body.bookid
	})
  .then(data => {
    res.send(data);
  })
  .catch(err => {
    res.send(error)
  })
});

var usersSchema=new mongoose.Schema({
  username:
  {
    type:String,
    unique:true,
    required:true
  },
  email:
  {
    type:String,
    unique:true,
    required:true
  },
  phone:
  {
    type:String,
    unique:true,
    required:true
  },
  password:
  {
    type:String,
    required:true
  },
  reset_password_token:
  {
    type:String
  },
  reset_password_expires:
  {
    type:String
  },
  isActive:
  {
    type:Boolean,
    default:true
  }
})

usersSchema.plugin(uniqueValidator);
var users =  mongoose.model('users', usersSchema);

var professionalsSchema=new mongoose.Schema({
  username:
  {
    type:String,
    unique:true,
    required:true
  },
  email:
  {
    type:String,
    unique:true,
    required:true
  },
  phone:
  {
    type:String,
    unique:true,
    required:true
  },
  password:
  {
    type:String,
    required:true
  },
  reset_password_token:
  {
    type:String
  },
  reset_password_expires:
  {
    type:String
  },
  location:
  {
    type:String,
    required:true
  },
  profession:
  {
    type:String,
    required:true
  },
  countservices:
  {
    type:Number,
    default:0
  },
  pendingfrom:
  {
    type:String
  },
  pendingto:
  {
    type:String
  },
  isActive:
  {
    type:Boolean,
    default:true
  }
});
professionalsSchema.plugin(uniqueValidator);
var professionals =  mongoose.model('professionals',  professionalsSchema);

app.get('/avail', function (req, res) {
	bookings.find({
    "location": req.session.location,
    "category": req.session.profession,
    "isAccepted":false,
	})
		.then(data => {
			res.send(data)
		})
		.catch(err => {
			res.send(error)
		})
});

app.get('/active',function(req,res)
{
	bookings.find({
    "takenBy":req.session.email,
    "idDone":false
	}).then(data=>{
			res.send(data)
		}).catch(err=>{
			res.send(error)
		})
});

app.get('/completed',function(req,res){
  var x;
  if(req.query.email!=undefined)
  x=req.query.email;
  else
  x=req.session.email;
	bookings.find({
    "takenBy":x,
    "idDone":true
	})
		.then(data => {
			res.send(data)
		})
		.catch(err => {
			res.send(error)
		})
});

app.post('/accept',function(req,res){
  bookings.findOneAndUpdate(
  {
    "_id":req.body.id
  },
  {
    "isAccepted":true,
    "takenBy":req.session.email
  },
  {
    new:true,
    runValidators:true
  })
  .then(data => {
    res.send(data)
  })
  .catch(err => {
    res.send()
  })
});

app.post('/doneItem',function(req,res){
  bookings.findOneAndUpdate(
  {
    "_id":req.body.id
  },
  {
    "idDone":true,
  },
  {
    new:true,
    runValidators:true
  })
  .then(data=>{
    professionals.findOneAndUpdate(
      {
        email:data.takenBy
      },
      {
        $inc:{countservices:1},
        pendingto:data.date
      },
      {
        new:true,
        runValidators:true
      }).then(data=>{res.send(data)}).catch(err=>{res.send()});
  })
  .catch(err => {
    res.send()
  })
});

var bookSchema=new mongoose.Schema({
  location: String,
  category: String,
  date: String,
  time: String,
  order: [{
    service: String,
    subService: String,
    quantity: String
  }],
  name: String,
  mobileNo: String,
  email: String,
  address: String,
  pinCode: String,
  isAccepted:
  {
    type:Boolean,
    default:false
  },
  idDone:
  {
    type:Boolean,
    default:false
  },
  takenBy:String
});
bookSchema.plugin(uniqueValidator);
var bookings =  mongoose.model('bookings', bookSchema);

app.get('/openBookings',function(req,res) {
	bookings.find({
    "email": req.session.email,
    "isAccepted":false
	})
		.then(data => {
			res.send(data)
		})
		.catch(err => {
			res.send(error)
		})
})

app.post('/cancelBooking', function (req, res) {
	bookings.remove({
    "_id": req.body.id
  })
  .then(data => {
    res.send(data);
  })
  .catch(err => {
    res.send(error)
  })
})

app.post('/review', function (req, res) {
	bookings.find({
    "_id": req.body.id
  })
  .then(data => {
    console.log(data);
    res.send(data);
  })
  .catch(err => {
    res.send(error)
  })
})

app.get('/activeBookings', function (req, res) {
	bookings.find({
    "email": req.session.email,
    "isAccepted":true,
    "idDone":false
	})
		.then(data => {
			res.send(data)
		})
		.catch(err => {
			res.send(error)
		})
})

app.get('/closedBookings', function (req, res) {
	bookings.find({
    "email": req.session.email,
    "idDone":true
	})
		.then(data => {
			res.send(data)
		})
		.catch(err => {
			res.send(error)
		})
})

app.post('/booking',function(req,res){
  var arr=JSON.parse(req.body.id);
  let newbooking = new bookings
  ({
    email: req.session.email,
    location: req.body.Location,
    category: req.body.category,
    date: req.body.Date,
    time: req.body.Time,
    order: arr,
    name: req.body.name,
    mobileNo: req.body.mobile,
    address: req.body.address,
    pinCode: req.body.pin
  })
  newbooking.save()
  .then(data =>{
    res.redirect('/Home');
  }).catch(err =>{
    res.send(err);
  })
});

var cartSchema=new mongoose.Schema({
  email: String,
  category: String,
  order: [{
    service: String,
    subService: String,
    quantity: String
  }]
})
cartSchema.plugin(uniqueValidator);
var cart =  mongoose.model('cart', cartSchema);

app.post('/addToCart',function(req,res){
  var arr=JSON.parse(req.body.id);
  cart.findOneAndUpdate({
    email:req.session.email,
    category:req.body.category
  },{
      $push: { order: arr }
  },
  {
    new:true,
    runValidators:true
  }).then
  (data=> {
    if(data)
    {
      res.send(data);
    }
    else {
      let newitem = new cart
      ({
        email: req.session.email,
        category: req.body.category,
        order: arr
      })
      newitem.save()
      .then(data =>{
        res.send(data);
      }).catch(err =>{
        res.send(err);
      })
    }
  }).catch(err=>{
    res.send(err);
  })
});

app.get('/allCartItems',function(req,res)
{
  cart.find({
    "email": req.session.email,
	})
  .then(data => {
    res.send(data)
  })
  .catch(err => {
    res.send(error)
  })
});

app.post('/checkout',function(req,res)
{
  cart.find({
    "_id": req.body.id,
	})
  .then(data => {
    res.send(data)
  })
  .catch(err => {
    res.send(error)
  })
});

app.post('/deleteCartItems', function (req, res) {
	cart.remove({
    "_id": req.body.id
  })
  .then(data => {
    res.send(data);
  })
  .catch(err => {
    res.send(error)
  })
})

app.post('/deleteCartItem', function (req, res) {
	cart.findOneAndUpdate({
		"_id": req.body.itemid
	},
  {
    $pull: { order : { _id: req.body.partid } }
  },
  {
    new: true,
    runValidators: true
  })
  .then(data => {
    if(data.order.length==0)
    {
      cart.remove({
        "_id": req.body.itemid
      })
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.send(error)
      })
    }
    res.send(data);
  })
  .catch(err => {})
});

function islogin(req,res,next)
{
  if(req.session.email==undefined)
    res.redirect('/');
  else
    next();
}

function sendmailss(data,token,res,req)
{
  var transporter=nodemailer.createTransport({
    service:'Gmail',
    auth:
    {
      user:process.env.GMAILID,
      pass:process.env.GMAILPW
    }
  });
  var mailOptions={
    to:data.email,
    from:process.env.GMAILID,
    subject:'password reset req',
    text:'localhost:3000/reset?token='+token+'&role='+req.body.role
  };
  transporter.sendMail(mailOptions,function(error,info){
    if(error)
    {
      console.log(error);
      res.send("oops due to some error in node mailer link do not send");
    }
    else
    {
      console.log('Email send');
      res.send('link send to your email');
    }
  });
}

function genandsettok(data,res,x,req)
{
  var token=require('crypto').randomBytes(32).toString('hex');
  x.findOneAndUpdate({email:data.email},{
    reset_password_token: token,
    reset_password_expires: Date.now()+600000
  },
  {
    new:true,
    runValidators:true
  }).then(data=>{
    sendmailss(data,token,res,req);
  }).catch(err=>{})
}

app.post('/forgot',function(req,res)
{
  var x;
  if(req.body.role=="user")
    x=users;
  else
    x=professionals;
  x.findOne({
    email:req.body.email
  }).then
  (data=> {
    if(data)
    {
      genandsettok(data,res,x,req);
    }
    else {
      res.send("email id does not exist");
    }
  }).catch(err=>{
  })
})

app.get('/reset',function(req,res)
{
  var x;
  if(req.query.role=="user")
    x=users;
  else
    x=professionals;
  x.findOne
  ({
    reset_password_token: req.query.token,
    reset_password_expires: {$gt: Date.now()}
  }).then(data=>{
    if(data)
    {
      res.render('reset',{token:req.query.token,role:req.query.role});
    }
    else
    {
      console.log(data);
      req.flash('error', 'Password Reset Token is Invalid or Expired');
      res.redirect('back');
    }
  }).catch(err=>{});
});

function sendmailsr(data,res,req)
{
  var transporter=nodemailer.createTransport({
    service:'Gmail',
    auth:
    {
      user:process.env.GMAILID,
      pass:process.env.GMAILPW
    }
  });
  var mailOptions={
    to:data.email,
    from:process.env.GMAILID,
    subject:'password reset succesfully',
    text: 'password changed for ' + data.email
  };
  transporter.sendMail(mailOptions,function(error,info){
    if(error)
    {
      req.flash('error', 'Password Reset Token is Invalid or Expired');
      res.redirect('/');
    }
    else
    {
      req.flash('error','Password Succesfully Reset');
      res.redirect('/');
    }
  });
}

app.post('/resetpas/:token/:role',function(req,res)
{
  var x;
  if(req.params.role=='user')
    x=users;
  else
    x=professionals;
  x.findOneAndUpdate
  ({
    reset_password_token: req.params.token,
    reset_password_expires :{$gt: Date.now()}
  },
  {
    reset_password_token: undefined,
    reset_password_expires: undefined,
    password:req.body.password
  },
  {
    new:true,
    runValidators:true
  }).then(data=>{
    if(!data)
    {
      req.flash('error', 'Password Reset Token is Invalid or Expired');
      res.redirect('/');
    }
    else
    {
      sendmailsr(data,res,req);
    }
  }).catch(err=>{});
});

app.post('/newuser',function (req, res)
{
  let newuser = new users
  ({
      username:req.body.username,
      email:req.body.email,
      password:req.body.password,
      phone:req.body.phone
  })
  newuser.save().then
  (data =>{
    res.send(data);
  }).catch(err =>{
    res.send(err);
  })
});

app.post('/newpro',function (req, res)
{
  let newprofessional=new professionals
  ({
    phone:req.body.phone,
    username:req.body.username,
    email:req.body.email,
    password:req.body.password,
    location:req.body.location,
    profession:req.body.profession,
    pendingfrom:new Date().toJSON().split('T')[0],
    pendingto:new Date().toJSON().split('T')[0]
  })
  newprofessional.save().then
  (data=>{res.send(data);}).catch(err=>{res.send(err);})
});

app.post('/login',function(req,res)
{
  var x;
  if(req.body.role=="user")
    x=users;
  else
    x=professionals;
  x.findOne({
    username:req.body.username,
    password:req.body.password
  }).then
  (data=>{
    if(data)
    {
      if(data.isActive)
      {
        req.session.email=data.email;
        if(x==professionals)
        {
          req.session.location=data.location;
          req.session.profession=data.profession;
        }
        res.send("login");
      }
      else
      {
        res.send("dea")
      }
    }
    else {
      res.send("try again");
    }
  }).catch(err=>{
    res.send(err);
  })
});

app.post('/changepassword',function(req,res)
{
  var x;
  if(req.body.ofWhich=="user")
    x=users;
  else
    x=professionals;
  x.findOneAndUpdate(
    {
      password:req.body.currentpassword,
      email:req.session.email
    },
    {
      password:req.body.newpassword
    },
    {
      new:true,
      runValidators:true
    }
  ).then(data=>{
    if(data)
    {
      res.send("Password Succesfully Changed");
    }
    else
    {
      res.send("Incorrect Password")
    }
  }).catch(err=>{});
});

app.get('/logout',function(req,res)
{
  req.session.destroy((err)=>
  {
    if(err)
    {
      return console.log(err);
    }
    res.redirect('/')
  });
});

app.get('/',function(req,res)
{
  res.render('index',{ message: req.flash('error') });
});

app.get('/bookingForm',islogin,function(req,res,next)
{
  res.render('bookingForm',{ 'which': req.session.which });
});

app.get('/bookings',islogin,function(req,res,next)
{
  res.render('bookings');
});

app.get('/bookActive',islogin,function(req,res,next)
{
  res.render('bookActive');
});

app.get('/bookDone',islogin,function(req,res,next)
{
  res.render('bookDone');
});

app.get('/cartItems',islogin,function(req,res,next)
{
  res.render('cartItems');
});

app.get('/Home',islogin,function(req,res,next)
{
  res.render('Home');
});

app.get('/acservice',islogin,function(req,res,next)
{
  req.session.which="AC";
  res.render('acservice');
});

app.get('/carpentry',islogin,function(req,res,next)
{
  req.session.which="Carpenter";
  res.render('carpentry');
});

app.get('/cleaning',islogin,function(req,res,next)
{
  req.session.which="HomeCleaning";
  res.render('cleaning')
});

app.get('/electrician',islogin,function(req,res,next)
{
  req.session.which="Electrician";
  res.render('electrician');
});

app.get('/geyser',islogin,function(req,res,next)
{
  req.session.which="Geyser";
  res.render('geyser')
});

app.get('/kitchen',islogin,function(req,res,next)
{
  req.session.which="KitchenTools";
  res.render('kitchen');
});

app.get('/microwave',islogin,function(req,res,next)
{
  req.session.which="MicrowaveOven";
  res.render('microwave');
});


app.get('/plumber',islogin,function(req,res,next)
{
  req.session.which="Plumber";
  res.render('plumber');
});

app.get('/waterpurifier',islogin,function(req,res,next)
{
  req.session.which="WaterPurifier";
  res.render('waterpurifier');
});

app.get('/pestcontrol',islogin,function(req,res,next)
{
  req.session.which="PestControl";
  res.render('pestcontrol')
});

app.get('/Aboutus',function(req,res)
{
  if(req.session.email==undefined)
    res.render('Aboutus',{'message':'header'});
  else
    res.render('Aboutus',{'message':'site_header'});
});

app.get('/privacypolicy',function(req,res)
{
  if(req.session.email==undefined)
    res.render('privacypolicy',{'message':'header'});
  else
    res.render('privacypolicy',{'message':'site_header'});
});

app.get('/termsandconditions',function(req,res)
{
  if(req.session.email==undefined)
    res.render('termsandconditions',{'message':'header'});
  else
    res.render('termsandconditions',{'message':'site_header'});
});

app.get('/proHome',islogin,function(req,res,next)
{
  res.render("proHome");
});

app.get('/proActive',islogin,function(req,res,next)
{
  res.render("proActive");
});



app.get('/userlist',islogin,function(req,res,next)
{
  res.render("userlist");
});

app.post('/userlist', function (req, res) {

  var col = req.body.order[0].column;
	var dir = req.body.order[0].dir;
	var dataCol = {
		0: "username",
		1: "email",
		2: "phone"
	}
	var dataDir = {
		"asc": 1,
		"desc": -1
	}

	getdata(dataCol[col], dataDir[dir]);

	function getdata(colname, sortorder) {
		var number;
		var x = users.count({}, function (err, count) {
			console.log('number of users :' + count);
			number = count;
		});
		var start = req.body.start;
		var length = req.body.length;
		var search = req.body.search.value;
		var findobj = {};

		if (search != '')
			findobj["$or"] = [{
				"username": { '$regex': search, '$options': 'i' }
			}, {
				"email": { '$regex': search, '$options': 'i' }
			}, {
				"phone": { '$regex': search, '$options': 'i' }
      },
    ]
		else {
			delete findobj["$or"];
		}

		var length;
		users.find(findobj).then(data => length = data.length).catch(err => console.log(err));
		users.find(findobj).skip(parseInt(start)).limit(parseInt(length)).sort({ [colname]: sortorder })
			.then(data => {
				res.send({
					"recordsTotal": String(number),
					"recordsFiltered": length,
					"start": parseInt(start),
					"length": parseInt(length), data
				})
			})
			.catch(err => {
				console.error(err)
				res.send("error getting info ")
			});
    }
  });

  app.post('/yes', function (req, res) {
    users.findOneAndUpdate(
      {
        _id: req.body.id
      },
      {
        isActive: req.body.flag
      },
      {
        new: true,                       // return updated doc
        runValidators: true              // validate before update
      })
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.send(error)
      })
  })

  app.post('/send', function (req, res) {
    let transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'adityaaggarwal32124@gmail.com', // generated ethereal user
        pass: process.env.GMAILPW // generated ethereal password
      }
    });

    let mailOptions = {
      from: 'adityaaggarwal32124@gmail.com', // sender address
      to: req.body.email, // list of receivers
      subject: req.body.sub, // Subject line
      html: '<html><body>' + req.body.write + '</body></html>'
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email send: ' + info.response);
      }
    });
  });

  app.post('/prolist',function(req,res)
  {
    var col=req.body.order[0].column;
    var dir=req.body.order[0].dir;
    var dataCol=
    {
      0:"username",
      1:"email",
      2:"location",
      3:"profession",
      4:"pendingfrom",
      5:"pendingto",
      6:"countservices"
    }
    var dataDir=
    {
      "asc":1,
      "desc":-1
    }
    getdata(dataCol[col],dataDir[dir]);
    function getdata(colname,sortorder)
    {
      var numberofpros;
      var x=professionals.count({},function(err,count)
      {
        numberofpros=count;
      });
      var start=req.body.start;
      var length=req.body.length;
      var search=req.body.search.value;
      var findobj={};
      if(search!='')
      {
        findobj["$or"]=
        [
          {"email": { '$regex' : search, '$options' : 'i' }},
          {"location": { '$regex' : search, '$options' : 'i' }},
          {"username": { '$regex' : search, '$options' : 'i'}},
          {"profession": { '$regex' : search, '$options' : 'i' }}
        ]
      }
      else
      {
        delete findobj["$or"];
      }
      var length;
      professionals.find(findobj).then(data=>length=data.length).catch(err=>console.log(err));
      professionals.find(findobj).skip(parseInt(start)).limit(parseInt(length)).sort({[colname]:sortorder})
      .then(data =>
        {
          res.send({"recordsTotal":String(numberofpros),"recordsFiltered":length,"start":parseInt(start),"length":parseInt(length),data})
        }).catch(err =>
          {
            console.error(err)
            res.send("error getting info ")
          })
  }
});
app.post('/sendmailtopro',function(req,res)
{
  let transporter=nodemailer.createTransport(
    {
      service:'gmail',
      secure:false,
      auth:{
        user:process.env.GMAILID,
        pass:process.env.GMAILPW
      }
});
let mailOptions=
{
  from:process.env.GMAILID,
  to:req.body.email,
  subject:req.body.subject,
  html: '<html><body>'+req.body.info+'</body></html>',
};
transporter.sendMail(mailOptions,function(error,info)
{
  if(error)
  {

  }
  else
  {
    res.send("send successfully");
  }
})
});
app.post('/toggling',function(req,res)
{
  professionals.findOneAndUpdate(
    {
      email:req.body.email
    },
  {
    $set:{isActive:!req.body.ac}
  },
{
  new:true,
  runValidators:true
}).then(data=>{if(data)
    {
      console.log(data);
      res.send("aa");
    }}).catch(err=>{});
})
app.post('/paydone',function(req,res){
  professionals.findOneAndUpdate(
    {
      email:req.body.email
    },
    {
      $set:
      {
        pendingfrom:new Date().toJSON().split('T')[0],
        pendingto:new Date().toJSON().split('T')[0],
        countservices:0
      }
    },
    {
      new:true,
      runValidators:true
    }
  ).then(data=>{res.send(data)}).catch(err=>{res.send(err)});
});
app.get('/proComp',islogin,function(req,res,next)
{
  res.render("proComp");
});
app.get('/prolist',function(req,res)
{
  res.render('prolist');
});
app.get('/feedback',function(req,res)
{
  res.render('feedback');
});

app.post('/contactus',function(req,res)
{
  let transporter=nodemailer.createTransport(
    {
      service:'gmail',
      secure:false,
      auth:{
        user:process.env.GMAILID,
        pass:process.env.GMAILPW
      }
});
let mailOptions=
{
  from:process.env.GMAILID,
  to:'aatif8015@gmail.com',
  subject:""+req.body.firstname+"!@@#"+req.body.lastname,
  html:"subject="+req.body.subject+"country"+req.body.country,
};
transporter.sendMail(mailOptions,function(error,info)
{
  if(error)
  {

  }
  else
  {
    res.redirect("/Aboutus");
  }
})

});
app.post('/adlogin',function(req,res)
{
  if(req.body.username===process.env.GMAILID && req.body.password===process.env.GMAILPW)
  {
    req.session.email=process.env.GMAILID;
    res.send("hurray");
  }
  else
  {
    res.send("try again");
  }

});
app.get('/promo',function(req,res)
{
  var c=process.env.COUPONCODES.split('@');
  res.send(c);
});
app.post('/valcoupan',function(req,res)
{
  var c=process.env.COUPONCODES.split('@');
  var i=0;
  for(i=0;i<c.length;i++)
  {
    var m=c[i].split('#');
    if(m[0]===req.body.coupan)
    break;
  }
  if(i===c.length)
  res.send("INVALID CODE");
  else
  {
    if(req.body.coupan==="NEWUSER40")
    {
      var n;
      var x=bookings.count({email:req.session.email,isAccepted:true},function(err,count)
      {
        if(count<5)
        {
          res.send("CODE APPLIED");
        }
        else
        {
          res.send("YOU HAVE ALREADY BOOKED FIVE SERVICE");
        }
      });
    }
    else
    {
      res.send("CODE APPLIED");
    }
  }
})

app.get('/feedback',function(req,res)
{
  res.render('feedback');
})

app.get('/feedbackShow',function(req,res)
{
  res.render('feedbackShow');
})

app.get('/penBook',function(req,res)
{
  res.render('penBook');
})
app.listen(3000);
