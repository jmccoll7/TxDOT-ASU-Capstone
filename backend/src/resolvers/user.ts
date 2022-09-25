import { User } from "../entities/User"
import { MyContext } from "src/types";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import argon2 from "argon2";

// Define input type for user table queries
@InputType()
class UsernamePasswordInput {
  @Field()
  username: string
  @Field()
  password: string
}

// Define error object
@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

// Define user response object
@ObjectType()
class UserResponse {
  @Field(() => [FieldError], {nullable: true})
  errors?: FieldError[];

  @Field(() => User, {nullable: true})
  user?: User;
}

// Define queries and updates for user table
@Resolver()
export class UserResolver {
  // Check current user identity
  @Query(() => User, {nullable: true})
  async me(
    @Ctx() { req, em }: MyContext
  ) {
    // you are not logged in
    if (!req.session.userId) {
      return null
    }
    const user = await em.findOne(User, {id: req.session.userId});
    return user;
  }

  // Register user
  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() {em}: MyContext
  ): Promise<UserResponse> {
    if (options.username.length <= 2) {
      return {
        errors: [{
          field: "username",
          message: "length must be greater than 2"
        }]
      }
    };
    if (options.password.length <= 3) {
      return {
        errors: [{
          field: "password",
          message: "length must be greater than 3"
        }]
      }
    };

    // Use argon2 to hash password for storage
    const hashedPassword = await argon2.hash(options.password)
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword
    });
    try{
      await em.persistAndFlush(user);
    } catch(err) {
      if (err.code === "23505") { 
        return {
          errors: [{
            field: 'username',
            message: 'username already exists'
          }]
        }
      }
      console.log('message: ', err.message)
    }
    return {
      user,
    }
  
  }

  // User login
  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() {em, req}: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOneOrFail(User, {username: options.username})
    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: "invalid login"
          }
        ]
      }
    }
    const valid = await argon2.verify(user.password, options.password)
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "invalid login"
          }
        ]
      }
    }

    req.session.userId = user.id;

    return {
      user
    }
  }
}