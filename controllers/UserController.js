//const mongo = require("../ut")
const mongoose = require("mongoose");
const request = require("../requests/userRequest");
const hmac = require("crypto");
const responseData = require("../response/Response");
const validation = require("../utilities/ValidateRequest");
const services = require("../MicroServices/userServices");
const userRequest = require("../requests/userRequest");
const userBalanceRequest = require("../requests/userBalanceRequest");
const findUserRequest = require("../requests/findUserRequest");
const crypto = require("crypto");

class UserController {
  static async register(request, response) {
    try {
      let Password =
        validation.isRequired(request.body.Password) &&
        validation.isString(request.body.Password)
          ? request.body.Password
          : false;
      if (Password) {
        // this is some changes
        let pHash = crypto
          .createHmac("sha256", "ride_request")
          .update(Password)
          .digest("hex");
        // console.log(pHash)
        let bodyInput = {
          Name: request.body.Name,
          PhoneNumber: request.body.PhoneNumber,
          EmailAddress: request.body.EmailAddress,
          Username: request.body.Username,
          PasswordHash: pHash,
          IsAccountActive: request.body.IsAccountActive,
          IsAccountConfirmed: request.body.IsAccountConfirmed,
          IsPhoneNumberConfirmed: request.body.IsPhoneNumberConfirmed,
        };
        console.log(bodyInput);
        let validationResult = validation.ValidateIncomingRequest(
          bodyInput,
          userRequest
        );
        console.log("validation result " + validationResult);
        if (validationResult == true) {
          let isUserExist = await await services().IsUserExistBefore(
            bodyInput.Username
          );

          if (!isUserExist) {
            let result = await await services().NewUser(bodyInput);

            if (result._id == null || result._id == "") {
              let apiresponse = responseData(
                "99",
                "failed",
                "failed to create user"
              );
              response.status(400).send(apiresponse);
            } else {
              let obj = {
               
                  id: result._id,
                  dateCreated: new Date().toLocaleDateString(),
               
              };
              let apiresponse = responseData("00", "success", obj);
              response.status(200).send(apiresponse);
            }
          } else {
            let obj = {
              message: `${bodyInput.Username} already exist`,
            };

            let apiresponse = responseData("99", "failed", obj);
            response.status(400).send(apiresponse);
          }
        } else {
          let apiresponse = responseData("99", "failed", {errors:validationResult});
          response.status(400).send(apiresponse);
        }
      } else {
        let apiresponse = responseData(
          "99",
          "failed",
          "password is required and must be string"
        );

        return response.status(400).send(apiresponse);
      }
    } catch (er) {
      response.status(400).send(new Error(er).message);
    }
  }

  static async login(request, response) {
    let input = {
      username:request.body.username,
      password:request.body.password
    }

    let result = await (await services().Login(input))
    if(result != null || result != undefined) 
    {
      
      let obj = {
        message:result.PasswordHash
      }
      let apiresponse= responseData("00", "success", obj)
      response.status(200).send(apiresponse)
    }
    else {
      let apiresponse= responseData("99", "failed", {message:"invalid username/password combination"})
      response.status(400).send(apiresponse)
    }
      
  }

  static async Search(request, response) {
    let searchinput = request.params.search

    let result = await (await services().Search(searchinput))
    if(result != null || result != undefined) {
      let apiresponse = responseData("00", "success", result)
       response.status(200).send(result)
    }
    else {
      let apiresponse = responseData("99", "failed", result)
       response.status(400).send(apiresponse)
    }
   
  }

  static async topupuser(request, response) {
    try {
      let bodyInput = {
        Username: request.body.username,
      };
      let validationResult = validation.ValidateIncomingRequest(
        bodyInput,
        findUserRequest
      );

      if (validationResult == true) {
        let findUser = await await services().FindUser(request.body.username);

        if (findUser != null || findUser != undefined) {
          let balanceInput = {
            Balance: request.body.amount,
          };
          let balanceValidationResult = validation.ValidateIncomingRequest(
            balanceInput,
            userBalanceRequest
          );

          if (balanceValidationResult == true) {
            let BalanceBody = {
              User: findUser,
              Balance: request.body.amount,
            };
            let serviceResponse = await await services().CreditUser(
              BalanceBody
            );

            if (serviceResponse._id != null || serviceResponse._id != "") {
              let obj = {
                message: `balance top up`,
              };
              let apiresponse = responseData("00", "success", obj);
              response.status(400).send(apiresponse);
            } else {
              let obj = {
                message: `failed to top -up user`,
              };
              let apiresponse = responseData("99", "failed", obj);
              response.status(400).send(apiresponse);
            }
          } else {
            let apiresponse = responseData(
              "99",
              "failed",
              balanceValidationResult
            );
            response.status(400).send(apiresponse);
          }
        } else {
          let obj = {
            message: `no match found for user with username: ${request.body.username}`,
          };
          let apiresponse = responseData("99", "failed", obj);
          response.status(400).send(apiresponse);
        }
      } else {
        let apiresponse = responseData("99", "failed", validationResult);
        response.status(500).send(apiresponse);
      }
    } catch (er) {
      let obj = {
        message: new Error(er).message,
        trace: new Error(er).stack
      };

      let apiresponse = responseData("99", "failed", obj);
      response.status(500).send(apiresponse);
    }
  }

  static async searchRide(request, response) {
    let searchParam = request.params.searchterm
    let result = await (await services().searchRide(searchParam))

    if(result != null || result != undefined) 
    {
      
      let obj = {
        message:result
      }
      let apiresponse= responseData("00", "success", obj)
      response.status(200).send(apiresponse)
    }
    else {
      let apiresponse= responseData("99", "failed", {message:"no available ride at the moment"})
      response.status(400).send(apiresponse)
    }
  }

  static async createride(request, response) {
    let bodyRequest = {
        startAt:request.body.startAt,
        endAt:request.body.endAt,
        nearByPlaces:request.body.nearbyPlaces,
        fare:request.body.fare,
        numberOfSeat:request.body.numberOfSeat,
        dateCreated:request.body.dateCreated
    }
    let result = await (await services().createRide(bodyRequest))

    if(result._id != null || result._id != "") {
      let responseInfo  = responseData("00", "success", {message:"ride placed"})
      response.status(200).send(responseInfo)
    }
    else {
      let apiresponse = responseData(
        "99",
        "failed",
        "failed to create ride"
      );

      response.status(400).send(apiresponse)
    }

  }

  static async riderequest(request, response) {
    let rideRequestParam = {
      UserId: request.body.UserId,
      rideId: request.body.rideId,
      dropAt: request.body.dropAt,
      pickupFrom: request.body.pickupFrom
    }

    let result = await (await services().RideRequest(rideRequestParam))

    if(result._id != "" || result._id != null) {
      let responseInfo  = responseData("00", "success", {message:"ride request placed"})
      response.status(200).send(responseInfo)
      
    }
    else {

      let apiresponse = responseData(
        "99",
        "failed",
        "failed to create user"
      );

      response.status(400).send(apiresponse)

    }
  }
}

module.exports = UserController;
