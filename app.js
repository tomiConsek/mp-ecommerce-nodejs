const express = require('express');
const exphbs  = require('express-handlebars');
const port = process.env.PORT || 3000

const app = express();

const mercadopago = require ('mercadopago')

mercadopago.configure({
    access_token: 'APP_USR-6317427424180639-042414-47e969706991d3a442922b0702a0da44-469485398',
    integrator_id: 'dev_24c65fb163bf11ea96500242ac130004',
});

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static('assets'));

app.use('/assets', express.static(__dirname + '/assets'));

app.get('/', function (req, res) {
    res.render('home');
});

app.get('/detail', function (req, res) {
    let elQuery = req.query
    res.render('detail', {elQuery:elQuery});
});

app.get('/callback', function (req, res) {
    //console.log(req.query);
    if (req.query.status.includes('success')){
        return res.render('success', {
            payment_type: req.query.payment_type,
            external_reference: req.query.external_reference,
            collection_id: req.query.collection_id
        })
    }
    
    if (req.query.status.includes('pending')){
        return res.render('pending')
    }
    
    if (req.query.status.includes('failure')){
        return res.render('failure')
    }
    return res.status(404).end();
});

app.post('/buy', function (req, res) {
    const host= 'https://tomiconsek-mp-commerce-nodejs.herokuapp.com/' //'https://tomiconsek-mp-commerce-nodejs.herokuapp.com/' //'http://localhost:3000/'
    const url= host + 'callback?status='
    
    let preference = {
        /**** MEDIOS DE PAGO ****/
        payment_methods : {
            installments: 6, 
            excluded_payment_methods:[
                {id:'amex'}
            ],
            excluded_payment_types: [
                {id:'atm'}
            ],
            
        },
        /**** INFORMACION DEL PAGADOR ****/
        payer:{
            name: 'Lalo',
            surname: 'Landa',
            email: 'test_user_63274575@testuser.com',
            phone:{
                area_code: '11',
                number: 22223333, //SDK Erroneo, va como integer ya que como string no lo toma y solicita number.
            },
            address:{
                street_name: 'False',
                street_number: 123,
                zip_code: '1111',
            },
        },
        /**** INFORMACION DEL PRODUCTO ****/
        items: [
            {
                id: 1234,
                title: req.body.title,
                description: 'Dispositivo móvil de Tienda e-commerce',
                picture_url: 'https://www.consekcomp.com/img/logo/logo.png',
                quantity: 1,
                unit_price: Number(req.body.price),
            }
        ],
        /**** EMAIL DEVELOPER ****/
        external_reference: 'jtomaschiesa@gmail.com',
        /**** URL's DE RETORNO ****/    
        back_urls:{
            success: url + 'success',
            pending: url + 'pending',
            failure: url + 'failure',
        },
        /**** RETORNO AUTOMATICO ****/ 
        auto_return: 'approved',
        /**** URL NOTIFICACIONES DE PAGO ****/ 
        notification_url: host+'webhooks',
    }
    
    
    mercadopago.preferences.create(preference)
    .then(function(preferenceCreated){
        res.render('buy', {preferenceCreated:preferenceCreated})
    }).catch(function(error){
        console.log(error);
        res.send('error')
    });
    
    
});

app.post('/webhooks', function (req, res) {
    console.log('*** webhook *** -->> ', req.body)
    res.status(200).send(req.body);
});


app.listen(port);